package com.flashcards.studio;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.flashcards.agent.AgentCreditService;
import com.flashcards.agent.AgentModelErrors;
import com.flashcards.agent.AgentProperties;
import com.flashcards.agent.CreditBalance;
import com.flashcards.billing.ExpiredStoreSubscriptionRefresh;
import com.flashcards.billing.ProAccess;
import com.flashcards.card.CardLanguages;
import com.flashcards.common.ApiException;
import com.flashcards.security.OwnedAccess;
import com.flashcards.user.User;
import com.flashcards.user.UserRepository;

import jakarta.annotation.PreDestroy;

@Service
public class LanguageStudioService {

    private static final Logger log = LoggerFactory.getLogger(LanguageStudioService.class);
    private static final Duration RETAIN = Duration.ofMinutes(30);
    private static final Set<String> SCENARIOS =
            Set.of("cafe", "airport", "doctor", "hotel", "pharmacy", "interview", "custom");
    private static final int LEARNED_CONTEXT_CHARS = 4000;
    static final int LEARNED_CONTEXT_SCENES = 5;
    private static final int LEARNED_CONTEXT_YOU_LINES = 4;
    private static final int IN_PROGRESS_CONTEXT_CHARS = 2000;
    static final int IN_PROGRESS_CONTEXT_SCENES = 8;
    private static final int IN_PROGRESS_CONTEXT_YOU_LINES = 2;

    private final LanguageConversationRepository conversationRepository;
    private final LanguageStudioPairService pairService;
    private final UserRepository userRepository;
    private final AgentCreditService creditService;
    private final AgentProperties properties;
    private final ExpiredStoreSubscriptionRefresh expiredStoreSubscriptionRefresh;
    private final ChatClient chatClient;
    private final ConcurrentHashMap<UUID, LanguageStudioJob> jobs = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<UUID, UUID> activeByUser = new ConcurrentHashMap<>();
    private final ExecutorService jobExecutor = Executors.newVirtualThreadPerTaskExecutor();

    public LanguageStudioService(
            LanguageConversationRepository conversationRepository,
            LanguageStudioPairService pairService,
            UserRepository userRepository,
            AgentCreditService creditService,
            AgentProperties properties,
            ExpiredStoreSubscriptionRefresh expiredStoreSubscriptionRefresh) {
        this.conversationRepository = conversationRepository;
        this.pairService = pairService;
        this.userRepository = userRepository;
        this.creditService = creditService;
        this.properties = properties;
        this.expiredStoreSubscriptionRefresh = expiredStoreSubscriptionRefresh;
        this.chatClient = properties.configured() ? ChatClient.create(openAiChatModel()) : null;
    }

    @Transactional(readOnly = true)
    public List<LanguageConversationResponse> list(UUID userId, String nativeLanguage, String targetLanguage) {
        User user = requireProUser(userId);
        List<LanguageConversation> rows;
        if (nativeLanguage != null && !nativeLanguage.isBlank() && targetLanguage != null && !targetLanguage.isBlank()) {
            String nativeCode = CardLanguages.normalize(nativeLanguage, CardLanguages.fromUserLocale(user.getLocale()));
            String targetCode = CardLanguages.normalize(targetLanguage, CardLanguages.DEFAULT);
            rows = conversationRepository.findByUser_IdAndNativeLanguageAndTargetLanguageOrderByUpdatedAtDesc(
                    user.getId(), nativeCode, targetCode);
        } else {
            rows = conversationRepository.findByUser_IdOrderByUpdatedAtDesc(user.getId());
        }
        return rows.stream().map(row -> toResponse(row, false)).toList();
    }

    @Transactional(readOnly = true)
    public LanguageConversationResponse get(UUID userId, UUID conversationId) {
        return toResponse(requireOwned(requireProUser(userId).getId(), conversationId), true);
    }

    @Transactional
    public LanguageConversationResponse rate(UUID userId, UUID conversationId, LanguageStudioRateRequest request) {
        LanguageConversation conversation = requireOwned(requireProUser(userId).getId(), conversationId);
        LanguageSceneStatus status = LanguageSceneStatus.from(request.status());
        conversation.setStatus(status);
        conversation.setLearnedAt(status == LanguageSceneStatus.LEARNED ? Instant.now() : null);
        conversation.setRatedAt(Instant.now());
        conversationRepository.save(conversation);
        return toResponse(conversation, true);
    }

    @Transactional
    public void delete(UUID userId, UUID conversationId) {
        LanguageConversation conversation = requireOwned(requireProUser(userId).getId(), conversationId);
        String nativeLanguage = conversation.getNativeLanguage();
        String targetLanguage = conversation.getTargetLanguage();
        conversationRepository.delete(conversation);
        pairService.forgetIfEmpty(userId, nativeLanguage, targetLanguage);
    }

    public LanguageStudioJobResponse startGenerate(UUID userId, LanguageStudioCreateRequest request) {
        expiredStoreSubscriptionRefresh.refresh(userId);
        User user = requireProUser(userId);
        if (!properties.configured() || chatClient == null) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "AI is not configured");
        }
        String nativeLanguage = CardLanguages.normalize(request.nativeLanguage(), CardLanguages.fromUserLocale(user.getLocale()));
        String targetLanguage = CardLanguages.normalize(request.targetLanguage(), CardLanguages.DEFAULT);
        if (nativeLanguage.equalsIgnoreCase(targetLanguage)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Choose two different languages");
        }
        String scenario = normalizeScenario(request.scenario());
        String customPrompt = request.customPrompt() == null ? "" : request.customPrompt().trim();
        if (customPrompt.length() > 240) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Keep the extra details under 240 characters");
        }
        if ("custom".equals(scenario) && customPrompt.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Describe the scene");
        }
        LanguageLevel level = LanguageLevel.from(request.level());
        CreditBalance credits = creditService.snapshot(user);
        if (credits.remainingCredits() <= 0) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Out of AI credits");
        }
        prune();
        UUID jobId = UUID.randomUUID();
        if (activeByUser.putIfAbsent(userId, jobId) != null) {
            throw new ApiException(HttpStatus.CONFLICT, "An AI deck is already being created. Wait for it to finish.");
        }
        LanguageStudioJob job = new LanguageStudioJob(jobId, userId, credits.remainingCredits());
        jobs.put(jobId, job);
        job.step("starting");
        String learned = request.useLearned() ? learnedContext(userId, nativeLanguage, targetLanguage) : "";
        String inProgress = inProgressContext(userId, nativeLanguage, targetLanguage);
        jobExecutor.execute(() -> {
            try {
                runGenerate(
                        job,
                        userId,
                        nativeLanguage,
                        targetLanguage,
                        scenario,
                        customPrompt,
                        level,
                        request.useLearned(),
                        learned,
                        inProgress);
            } finally {
                activeByUser.remove(userId, jobId);
            }
        });
        return job.toResponse();
    }

    public LanguageStudioJobResponse getJob(UUID userId, UUID jobId) {
        prune();
        LanguageStudioJob job = jobs.get(jobId);
        if (job == null || !job.userId().equals(userId)) {
            throw OwnedAccess.hidden("Agent job not found");
        }
        return job.toResponse();
    }

    private void runGenerate(
            LanguageStudioJob job,
            UUID userId,
            String nativeLanguage,
            String targetLanguage,
            String scenario,
            String customPrompt,
            LanguageLevel level,
            boolean useLearned,
            String learned,
            String inProgress) {
        job.step("callingModel");
        try {
            String reply = null;
            for (int attempt = 1; attempt <= AgentModelErrors.MAX_ATTEMPTS; attempt++) {
                try {
                    long started = System.currentTimeMillis();
                    log.info("[studio {}] calling model {} attempt={}", job.id(), properties.model(), attempt);
                    reply = chatClient.prompt()
                            .system(systemPrompt())
                            .user(userMessage(
                                    nativeLanguage, targetLanguage, scenario, customPrompt, level, learned, inProgress))
                            .call()
                            .content();
                    log.info(
                            "[studio {}] model returned in {}ms replyChars={}",
                            job.id(),
                            System.currentTimeMillis() - started,
                            reply == null ? 0 : reply.length());
                    break;
                } catch (RuntimeException ex) {
                    boolean retry = AgentModelErrors.isBusy(ex) && attempt < AgentModelErrors.MAX_ATTEMPTS;
                    if (retry) {
                        log.warn("[studio {}] provider busy on attempt {}/{}, retrying", job.id(), attempt, AgentModelErrors.MAX_ATTEMPTS);
                        pause(AgentModelErrors.retryWaitMs(attempt - 1));
                        continue;
                    }
                    job.fail(studioUserMessage(ex));
                    return;
                }
            }
            LanguageStudioDraft draft = LanguageStudioDraftParser.parse(reply);
            job.step("finishing");
            User user = requireProUser(userId);
            LanguageConversation saved = saveDraft(
                    user,
                    draft,
                    scenario,
                    customPrompt.isBlank() ? null : customPrompt,
                    level,
                    nativeLanguage,
                    targetLanguage,
                    useLearned,
                    false);
            CreditBalance credits;
            try {
                credits = creditService.consume(user.getId(), job.id());
            } catch (RuntimeException ex) {
                conversationRepository.delete(saved);
                throw ex;
            }
            job.complete(toResponse(saved, true), credits.remainingCredits());
        } catch (ApiException ex) {
            log.warn("[studio {}] failed: {}", job.id(), ex.getMessage());
            job.fail(ex.getMessage());
        } catch (RuntimeException ex) {
            log.error("[studio {}] failed", job.id(), ex);
            job.fail(studioUserMessage(ex));
        }
    }

    private LanguageConversation saveDraft(
            User user,
            LanguageStudioDraft draft,
            String scenario,
            String customPrompt,
            LanguageLevel level,
            String nativeLanguage,
            String targetLanguage,
            boolean useLearned,
            boolean sample) {
        LanguageConversation conversation = new LanguageConversation();
        conversation.setUser(user);
        conversation.setTitle(draft.title());
        conversation.setScenario(scenario);
        conversation.setCustomPrompt(customPrompt);
        conversation.setLevel(level);
        conversation.setNativeLanguage(nativeLanguage);
        conversation.setTargetLanguage(targetLanguage);
        conversation.setYourRole(draft.yourRole());
        conversation.setTheirRole(draft.theirRole());
        conversation.setStatus(LanguageSceneStatus.LEARNING);
        conversation.setUsedLearned(useLearned);
        conversation.setSample(sample);
        List<LanguageTurn> turns = new ArrayList<>();
        for (LanguageStudioDraft.Turn row : draft.turns()) {
            LanguageTurn turn = new LanguageTurn();
            turn.setRole(row.role());
            turn.setSpeaker(row.speaker());
            turn.setNativeText(row.nativeText());
            turn.setTargetText(row.targetText());
            turns.add(turn);
        }
        conversation.setTurns(turns);
        LanguageConversation saved = conversationRepository.save(conversation);
        pairService.touch(user, nativeLanguage, targetLanguage, level);
        return saved;
    }

    String learnedContext(UUID userId, String nativeLanguage, String targetLanguage) {
        List<LanguageConversation> learned = conversationRepository
                .findByUser_IdAndStatusAndNativeLanguageAndTargetLanguageOrderByLearnedAtDescUpdatedAtDesc(
                        userId,
                        LanguageSceneStatus.LEARNED,
                        nativeLanguage,
                        targetLanguage,
                        PageRequest.of(0, LEARNED_CONTEXT_SCENES));
        return appendSceneLines(learned, LEARNED_CONTEXT_YOU_LINES, LEARNED_CONTEXT_CHARS);
    }

    String inProgressContext(UUID userId, String nativeLanguage, String targetLanguage) {
        List<LanguageConversation> inProgress = conversationRepository
                .findByUser_IdAndNativeLanguageAndTargetLanguageAndStatusNotOrderByUpdatedAtDesc(
                        userId,
                        nativeLanguage,
                        targetLanguage,
                        LanguageSceneStatus.LEARNED,
                        PageRequest.of(0, IN_PROGRESS_CONTEXT_SCENES));
        return appendSceneLines(inProgress, IN_PROGRESS_CONTEXT_YOU_LINES, IN_PROGRESS_CONTEXT_CHARS);
    }

    private static String appendSceneLines(List<LanguageConversation> scenes, int youLines, int charCap) {
        if (scenes == null || scenes.isEmpty()) {
            return "";
        }
        StringBuilder out = new StringBuilder();
        for (LanguageConversation conversation : scenes) {
            out.append("- ")
                    .append(conversation.getTitle())
                    .append(" [")
                    .append(conversation.getScenario())
                    .append(", ")
                    .append(conversation.getLevel())
                    .append("]\n");
            int used = 0;
            List<LanguageTurn> turns = conversation.getTurns();
            if (turns != null) {
                for (LanguageTurn turn : turns) {
                    if (turn.getRole() != LanguageTurnRole.YOU) {
                        continue;
                    }
                    String line = turn.getTargetText();
                    if (line == null || line.isBlank()) {
                        continue;
                    }
                    out.append("  ").append(line).append('\n');
                    used++;
                    if (used >= youLines) {
                        break;
                    }
                }
            }
            if (out.length() >= charCap) {
                break;
            }
        }
        return out.length() > charCap ? out.substring(0, charCap) : out.toString();
    }

    private LanguageConversation requireOwned(UUID userId, UUID conversationId) {
        return conversationRepository
                .findByIdAndUser_Id(conversationId, userId)
                .orElseThrow(() -> OwnedAccess.hidden("Conversation not found"));
    }

    private User requireProUser(UUID userId) {
        expiredStoreSubscriptionRefresh.refresh(userId);
        User user = userRepository
                .findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Not authenticated"));
        ProAccess.require(user);
        return user;
    }

    static LanguageConversationResponse toResponse(LanguageConversation conversation, boolean includeTurns) {
        List<LanguageTurnResponse> turns = List.of();
        if (includeTurns) {
            turns = conversation.getTurns().stream()
                    .map(turn -> new LanguageTurnResponse(
                            turn.getRole().name().toLowerCase(Locale.ROOT),
                            turn.getSpeaker(),
                            turn.getNativeText(),
                            turn.getTargetText()))
                    .toList();
        }
        return new LanguageConversationResponse(
                conversation.getId(),
                conversation.getTitle(),
                conversation.getScenario(),
                conversation.getCustomPrompt(),
                conversation.getLevel().name(),
                conversation.getNativeLanguage(),
                conversation.getTargetLanguage(),
                conversation.getYourRole(),
                conversation.getTheirRole(),
                conversation.getStatus().name(),
                conversation.isUsedLearned(),
                conversation.isSample(),
                conversation.getSampleScene() == null ? null : conversation.getSampleScene().getSlug(),
                conversation.getTurns() == null ? 0 : conversation.getTurns().size(),
                turns,
                conversation.getRatedAt(),
                conversation.getCreatedAt(),
                conversation.getUpdatedAt());
    }

    private static String normalizeScenario(String value) {
        String normalized = value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
        if (!SCENARIOS.contains(normalized)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Choose a scenario");
        }
        return normalized;
    }

    private static String systemPrompt() {
        return """
                You write short spoken dialogues for language learners.
                Reply with JSON only, no markdown.
                The JSON shape is:
                {"title":"","yourRole":"","theirRole":"","turns":[{"role":"them","speaker":"","native":"","target":""}]}
                role is them or you.
                native is the meaning in the learner's native language.
                target is the spoken line in the language they are learning.
                THEM turns are what the other person says in the target language.
                YOU turns are the line the learner should say in the target language.
                Write 8 turns when you can, never fewer than 6 or more than 12.
                Alternate speakers. Keep lines speakable aloud, not written essays.
                If the user lists known lines, recycle a few of those words in a new situation; do not remake the old scene.
                If the user lists in-progress scenes, do not copy them or treat their lines as known.
                """;
    }

    private static String userMessage(
            String nativeLanguage,
            String targetLanguage,
            String scenario,
            String customPrompt,
            LanguageLevel level,
            String learned,
            String inProgress) {
        String extra = customPrompt.isBlank() ? "" : " Extra details: " + customPrompt;
        return "I speak " + nativeLanguage + ". I am learning " + targetLanguage + ". "
                + LanguageStudioDraftParser.levelHint(level) + " The scene is "
                + LanguageStudioDraftParser.scenarioLabel(scenario) + "." + extra
                + " I play the visitor, customer, patient, guest, or applicant as the scene requires."
                + historyBlock(learned, inProgress);
    }

    static String historyBlock(String learned, String inProgress) {
        StringBuilder out = new StringBuilder();
        if (inProgress != null && !inProgress.isBlank()) {
            out.append("""

                    These scenes are still in progress. The learner has not mastered them.
                    Do not remake their plot, roles, or sentences. Do not recycle their phrases as known vocabulary.
                    If the new scene is the same kind of place, give it a clearly different task and different lines.

                    """);
            out.append(inProgress);
        }
        if (learned != null && !learned.isBlank()) {
            out.append("""

                    The learner can already say these YOU lines. Treat them as vocabulary they can handle, not as a script to remake.
                    Write a different situation. Recycle about 3 to 6 of those words or short chunks inside new YOU lines, with different surrounding language, then add new related language at the requested level.
                    Prefer content words and short useful chunks, not whole clauses. Spread recycled words across the dialogue. Do not copy sentences, roles, or the plot of a known scene.

                    """);
            out.append(learned);
        }
        return out.toString();
    }

    private OpenAiChatModel openAiChatModel() {
        int timeout = properties.timeoutSeconds() <= 0 ? 90 : properties.timeoutSeconds();
        return OpenAiChatModel.builder()
                .options(OpenAiChatOptions.builder()
                        .baseUrl(properties.baseUrl())
                        .apiKey(properties.apiKey())
                        .model(properties.model())
                        .temperature(0.55)
                        .timeout(Duration.ofSeconds(timeout))
                        .maxTokens(4096)
                        .parallelToolCalls(false)
                        .build())
                .build();
    }

    private static String studioUserMessage(Throwable error) {
        String message = AgentModelErrors.userMessage(error);
        if (AgentModelErrors.FAILED.equals(message)) {
            return "The AI did not create a conversation. You were not charged.";
        }
        return message;
    }

    private static void pause(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, AgentModelErrors.BUSY);
        }
    }

    private void prune() {
        Instant cutoff = Instant.now().minus(RETAIN);
        jobs.entrySet().removeIf(entry -> {
            LanguageStudioJob job = entry.getValue();
            if (!job.createdAt().isBefore(cutoff)) {
                return false;
            }
            activeByUser.remove(job.userId(), job.id());
            return true;
        });
    }

    @PreDestroy
    void shutdown() {
        jobExecutor.shutdownNow();
    }
}
