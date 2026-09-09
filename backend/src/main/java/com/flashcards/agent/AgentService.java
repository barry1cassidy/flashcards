package com.flashcards.agent;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.flashcards.billing.ProAccess;
import com.flashcards.card.CardLanguages;
import com.flashcards.card.CardService;
import com.flashcards.common.ApiException;
import com.flashcards.deck.DeckService;
import com.flashcards.group.GroupResponse;
import com.flashcards.group.GroupService;
import com.flashcards.user.User;
import com.flashcards.user.UserRepository;

import jakarta.annotation.PreDestroy;

@Service
public class AgentService {

    private static final Logger log = LoggerFactory.getLogger(AgentService.class);

    private final AgentProperties properties;
    private final AgentUsageService usageService;
    private final UserRepository userRepository;
    private final GroupService groupService;
    private final DeckService deckService;
    private final CardService cardService;
    private final AgentJobStore jobStore;
    private final ChatClient chatClient;
    private final ExecutorService jobExecutor = Executors.newVirtualThreadPerTaskExecutor();
    private final ScheduledExecutorService heartbeat = Executors.newSingleThreadScheduledExecutor(thread -> {
        Thread named = new Thread(thread, "agent-heartbeat");
        named.setDaemon(true);
        return named;
    });

    public AgentService(
            AgentProperties properties,
            AgentUsageService usageService,
            UserRepository userRepository,
            GroupService groupService,
            DeckService deckService,
            CardService cardService,
            AgentJobStore jobStore) {
        this.properties = properties;
        this.usageService = usageService;
        this.userRepository = userRepository;
        this.groupService = groupService;
        this.deckService = deckService;
        this.cardService = cardService;
        this.jobStore = jobStore;
        this.chatClient = properties.configured() ? ChatClient.create(openAiChatModel()) : null;
    }

    public AgentStatusResponse status(UUID userId) {
        User user = requireUser(userId);
        boolean pro = user.isProLicensed();
        int remaining = pro ? usageService.remainingToday(userId) : 0;
        return new AgentStatusResponse(!pro, properties.configured(), remaining, properties.dailyLimit());
    }

    public AgentJobResponse startCreateDeck(UUID userId, AgentCreateRequest request) {
        User user = requireUser(userId);
        ProAccess.require(user);
        if (!properties.configured() || chatClient == null) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "AI is not configured");
        }
        String prompt = request.prompt() == null ? "" : request.prompt().trim();
        if (prompt.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Validation failed");
        }
        GroupResponse preferredSet = request.setId() == null
                ? null
                : groupService.get(userId, request.setId()).group();
        int remaining = usageService.consume(userId);
        AgentJob job = jobStore.create(userId, remaining);
        log.info(
                "[agent {}] queued model={} timeout={}s promptChars={} set={}",
                job.id(),
                properties.model(),
                properties.timeoutSeconds(),
                prompt.length(),
                preferredSet == null ? "-" : preferredSet.id());
        job.step("starting", null);
        jobExecutor.execute(() -> runJob(job, userId, prompt, preferredSet, remaining));
        return job.toResponse();
    }

    public AgentJobResponse getJob(UUID userId, UUID jobId) {
        return jobStore.require(userId, jobId).toResponse();
    }

    private void runJob(AgentJob job, UUID userId, String prompt, GroupResponse preferredSet, int remaining) {
        ScheduledFuture<?> beat = heartbeat.scheduleAtFixedRate(
                () -> {
                    if (job.state() == AgentJob.State.RUNNING) {
                        long secs = Duration.between(job.createdAt(), Instant.now()).toSeconds();
                        if (secs >= 60) {
                            log.warn(
                                    "[agent {}] still running after {}s (last step: {}) — possible hang",
                                    job.id(),
                                    secs,
                                    job.lastStepCode());
                        } else {
                            log.info(
                                    "[agent {}] still running after {}s (last step: {})",
                                    job.id(),
                                    secs,
                                    job.lastStepCode());
                        }
                    }
                },
                10,
                10,
                TimeUnit.SECONDS);
        AgentTools tools = new AgentTools(
                userId,
                preferredSet == null ? null : preferredSet.id(),
                properties.maxCards(),
                groupService,
                deckService,
                cardService,
                job);
        try {
            job.step("callingModel", properties.model());
            long started = System.currentTimeMillis();
            log.info("[agent {}] calling model {}", job.id(), properties.model());
            String reply = chatClient.prompt()
                    .system(systemPrompt())
                    .user(userMessage(prompt, preferredSet))
                    .tools(tools)
                    .call()
                    .content();
            long elapsedMs = System.currentTimeMillis() - started;
            log.info(
                    "[agent {}] model returned in {}ms replyChars={}",
                    job.id(),
                    elapsedMs,
                    reply == null ? 0 : reply.length());
            if (tools.createdDeckId() == null) {
                job.fail("The AI did not create a deck");
                return;
            }
            job.step("finishing", null);
            String message = tools.cardsAdded() == 0
                    ? "Created the deck, but no cards were added. You can edit it and try again."
                    : "Created a deck with " + tools.cardsAdded() + " cards.";
            job.complete(new AgentCreateResponse(
                    message,
                    tools.createdDeckId(),
                    tools.createdSetId(),
                    tools.cardsAdded(),
                    remaining));
        } catch (ApiException ex) {
            log.warn("[agent {}] failed: {}", job.id(), ex.getMessage());
            job.fail(ex.getMessage());
        } catch (RuntimeException ex) {
            log.error("[agent {}] failed", job.id(), ex);
            job.fail("AI request failed");
        } finally {
            beat.cancel(false);
        }
    }

    private OpenAiChatModel openAiChatModel() {
        int timeout = properties.timeoutSeconds() <= 0 ? 90 : properties.timeoutSeconds();
        return OpenAiChatModel.builder()
                .options(OpenAiChatOptions.builder()
                        .baseUrl(properties.baseUrl())
                        .apiKey(properties.apiKey())
                        .model(properties.model())
                        .temperature(0.3)
                        .timeout(Duration.ofSeconds(timeout))
                        .maxTokens(8192)
                        .parallelToolCalls(false)
                        .build())
                .build();
    }

    private static String systemPrompt() {
        String languages = CardLanguages.CODES.stream().collect(Collectors.joining(", "));
        return """
                You create flashcard decks for a spaced-repetition app.
                You must use tools. Do not only describe a deck in text.
                Create exactly one deck per request, then add cards to that deck.
                Use createSet only if the user wants a named class, course, or collection, or if no set was provided and a set would clearly help.
                If an existing set is provided, put the deck in that set and do not create another set.
                Card languages must be BCP-47 codes from this list: %s.
                Add 12 to 40 cards unless the user asked for a specific count. Never exceed 40.
                Each card needs a short front (the prompt) and a short back (the answer). Hints are optional.
                After the tools succeed, reply with a one-sentence confirmation.
                """.formatted(languages);
    }

    private static String userMessage(String prompt, GroupResponse preferredSet) {
        if (preferredSet == null) {
            return prompt;
        }
        return prompt + "\n\nPlace this deck in existing set \"" + preferredSet.name() + "\" (setId "
                + preferredSet.id() + ").";
    }

    private User requireUser(UUID userId) {
        return userRepository
                .findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Not authenticated"));
    }

    @PreDestroy
    void shutdown() {
        jobExecutor.shutdown();
        heartbeat.shutdownNow();
    }
}
