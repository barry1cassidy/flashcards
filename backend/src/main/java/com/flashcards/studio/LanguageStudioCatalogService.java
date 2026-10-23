package com.flashcards.studio;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.flashcards.billing.ExpiredStoreSubscriptionRefresh;
import com.flashcards.billing.ProAccess;
import com.flashcards.card.CardLanguages;
import com.flashcards.common.ApiException;
import com.flashcards.user.User;
import com.flashcards.user.UserRepository;

@Service
public class LanguageStudioCatalogService {

    private final StudioSampleSceneRepository sceneRepository;
    private final LanguageConversationRepository conversationRepository;
    private final LanguageStudioPairService pairService;
    private final UserRepository userRepository;
    private final ExpiredStoreSubscriptionRefresh expiredStoreSubscriptionRefresh;

    public LanguageStudioCatalogService(
            StudioSampleSceneRepository sceneRepository,
            LanguageConversationRepository conversationRepository,
            LanguageStudioPairService pairService,
            UserRepository userRepository,
            ExpiredStoreSubscriptionRefresh expiredStoreSubscriptionRefresh) {
        this.sceneRepository = sceneRepository;
        this.conversationRepository = conversationRepository;
        this.pairService = pairService;
        this.userRepository = userRepository;
        this.expiredStoreSubscriptionRefresh = expiredStoreSubscriptionRefresh;
    }

    @Transactional(readOnly = true)
    public List<LanguageStudioSampleSummary> list(UUID userId, String nativeLanguage, String targetLanguage) {
        User user = requireProUser(userId);
        Pair pair = pair(nativeLanguage, targetLanguage, user);
        return sceneRepository.findAllByOrderByPositionAsc().stream()
                .map(scene -> toSummary(scene, pair, user.getId()))
                .filter(row -> row != null)
                .toList();
    }

    @Transactional(readOnly = true)
    public LanguageStudioSampleResponse get(UUID userId, String slug, String nativeLanguage, String targetLanguage) {
        User user = requireProUser(userId);
        Pair pair = pair(nativeLanguage, targetLanguage, user);
        StudioSampleScene scene = sceneRepository
                .findBySlug(slug)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Sample not found"));
        LanguageStudioSampleResponse response = toResponse(scene, pair, user.getId());
        if (response == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Sample not found");
        }
        return response;
    }

    @Transactional
    public LanguageConversationResponse copy(UUID userId, String slug, String nativeLanguage, String targetLanguage) {
        User user = requireProUser(userId);
        Pair pair = pair(nativeLanguage, targetLanguage, user);
        StudioSampleScene scene = sceneRepository
                .findBySlug(slug)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Sample not found"));
        LanguageStudioDraft draft = draft(scene, pair);
        if (draft == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Sample not found");
        }
        return conversationRepository
                .findByUser_IdAndSampleScene_IdAndNativeLanguageAndTargetLanguage(
                        user.getId(), scene.getId(), pair.nativeLanguage(), pair.targetLanguage())
                .map(row -> LanguageStudioService.toResponse(row, true))
                .orElseGet(() -> LanguageStudioService.toResponse(saveCopy(user, scene, draft, pair), true));
    }

    private LanguageConversation saveCopy(User user, StudioSampleScene scene, LanguageStudioDraft draft, Pair pair) {
        LanguageConversation conversation = new LanguageConversation();
        conversation.setUser(user);
        conversation.setTitle(draft.title());
        conversation.setScenario(scene.getScenario());
        conversation.setLevel(scene.getLevel());
        conversation.setNativeLanguage(pair.nativeLanguage());
        conversation.setTargetLanguage(pair.targetLanguage());
        conversation.setYourRole(draft.yourRole());
        conversation.setTheirRole(draft.theirRole());
        conversation.setStatus(LanguageSceneStatus.LEARNING);
        conversation.setSample(true);
        conversation.setSampleScene(scene);
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
        pairService.touch(user, pair.nativeLanguage(), pair.targetLanguage(), null);
        return saved;
    }

    private LanguageStudioSampleSummary toSummary(StudioSampleScene scene, Pair pair, UUID userId) {
        LanguageStudioDraft draft = draft(scene, pair);
        if (draft == null) {
            return null;
        }
        return new LanguageStudioSampleSummary(
                scene.getSlug(),
                scene.getScenario(),
                scene.getLevel().name(),
                draft.title(),
                draft.yourRole(),
                draft.theirRole(),
                pair.nativeLanguage(),
                pair.targetLanguage(),
                draft.turns().size(),
                copiedId(userId, scene, pair));
    }

    private LanguageStudioSampleResponse toResponse(StudioSampleScene scene, Pair pair, UUID userId) {
        LanguageStudioDraft draft = draft(scene, pair);
        if (draft == null) {
            return null;
        }
        List<LanguageTurnResponse> turns = draft.turns().stream()
                .map(turn -> new LanguageTurnResponse(
                        turn.role().name().toLowerCase(Locale.ROOT),
                        turn.speaker(),
                        turn.nativeText(),
                        turn.targetText()))
                .toList();
        return new LanguageStudioSampleResponse(
                scene.getSlug(),
                scene.getScenario(),
                scene.getLevel().name(),
                draft.title(),
                draft.yourRole(),
                draft.theirRole(),
                pair.nativeLanguage(),
                pair.targetLanguage(),
                turns.size(),
                copiedId(userId, scene, pair),
                turns);
    }

    private UUID copiedId(UUID userId, StudioSampleScene scene, Pair pair) {
        return conversationRepository
                .findByUser_IdAndSampleScene_IdAndNativeLanguageAndTargetLanguage(
                        userId, scene.getId(), pair.nativeLanguage(), pair.targetLanguage())
                .map(LanguageConversation::getId)
                .orElse(null);
    }

    private static LanguageStudioDraft draft(StudioSampleScene scene, Pair pair) {
        StudioSampleI18n meta = i18n(scene, pair.nativeLanguage());
        if (meta == null) {
            meta = i18n(scene, StudioSampleLanguages.ENGLISH);
        }
        if (meta == null) {
            return null;
        }
        List<LanguageStudioDraft.Turn> turns = new ArrayList<>();
        for (StudioSampleTurn turn : scene.getTurns()) {
            StudioSampleLine nativeLine = line(turn, pair.nativeLanguage());
            StudioSampleLine targetLine = line(turn, pair.targetLanguage());
            if (nativeLine == null || targetLine == null) {
                return null;
            }
            turns.add(new LanguageStudioDraft.Turn(
                    turn.getRole(),
                    nativeLine.getSpeaker(),
                    nativeLine.getLine(),
                    targetLine.getLine()));
        }
        if (turns.size() < LanguageStudioDraftParser.MIN_TURNS) {
            return null;
        }
        return new LanguageStudioDraft(meta.getTitle(), meta.getYourRole(), meta.getTheirRole(), List.copyOf(turns));
    }

    private static StudioSampleI18n i18n(StudioSampleScene scene, String language) {
        for (StudioSampleI18n row : scene.getTexts()) {
            if (language.equals(row.getId().getLanguage())) {
                return row;
            }
        }
        return null;
    }

    private static StudioSampleLine line(StudioSampleTurn turn, String language) {
        for (StudioSampleLine row : turn.getLines()) {
            if (language.equals(row.getId().getLanguage())) {
                return row;
            }
        }
        return null;
    }

    private Pair pair(String nativeLanguage, String targetLanguage, User user) {
        String nativeCode = CardLanguages.normalize(nativeLanguage, CardLanguages.fromUserLocale(user.getLocale()));
        String targetCode = CardLanguages.normalize(targetLanguage, CardLanguages.DEFAULT);
        if (!StudioSampleLanguages.supportedPair(nativeCode, targetCode)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Samples are to and from English");
        }
        return new Pair(nativeCode, targetCode);
    }

    private User requireUser(UUID userId) {
        expiredStoreSubscriptionRefresh.refresh(userId);
        return userRepository
                .findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Not authenticated"));
    }

    private User requireProUser(UUID userId) {
        User user = requireUser(userId);
        ProAccess.require(user);
        return user;
    }

    private record Pair(String nativeLanguage, String targetLanguage) {
    }
}
