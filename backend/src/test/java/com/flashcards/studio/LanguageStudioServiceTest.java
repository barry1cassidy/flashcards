package com.flashcards.studio;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;

import com.flashcards.agent.AgentCreditService;
import com.flashcards.agent.AgentProperties;
import com.flashcards.billing.ExpiredStoreSubscriptionRefresh;
import com.flashcards.common.ApiException;
import com.flashcards.user.User;
import com.flashcards.user.UserRepository;

@ExtendWith(MockitoExtension.class)
class LanguageStudioServiceTest {

    private static final UUID USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000031");

    @Mock
    private LanguageConversationRepository conversationRepository;
    @Mock
    private LanguageStudioPairService pairService;
    @Mock
    private UserRepository userRepository;
    @Mock
    private AgentCreditService creditService;
    @Mock
    private ExpiredStoreSubscriptionRefresh expiredStoreSubscriptionRefresh;

    private LanguageStudioService studioService;
    private User user;

    @BeforeEach
    void setUp() {
        studioService = new LanguageStudioService(
                conversationRepository,
                pairService,
                userRepository,
                creditService,
                new AgentProperties("", "", "", 10, 10, 40, 90, 0, 0, 0, 0),
                expiredStoreSubscriptionRefresh);
        user = new User();
        user.setId(USER_ID);
        user.setProLicensed(true);
        lenient().when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
    }

    @Test
    void ratesTheWholeScene() {
        LanguageConversation conversation = scene("At the pharmacy");
        when(conversationRepository.findByIdAndUser_Id(conversation.getId(), USER_ID))
                .thenReturn(Optional.of(conversation));
        when(conversationRepository.save(conversation)).thenReturn(conversation);

        LanguageConversationResponse response =
                studioService.rate(USER_ID, conversation.getId(), new LanguageStudioRateRequest("LEARNED"));

        assertEquals("LEARNED", response.status());
        assertEquals(LanguageSceneStatus.LEARNED, conversation.getStatus());
        assertNotNull(conversation.getLearnedAt());
        assertNotNull(conversation.getRatedAt());
        assertNotNull(response.ratedAt());
    }

    @Test
    void deleteDropsThePairWhenNoConversationsRemain() {
        LanguageConversation conversation = scene("At the pharmacy");
        when(conversationRepository.findByIdAndUser_Id(conversation.getId(), USER_ID))
                .thenReturn(Optional.of(conversation));

        studioService.delete(USER_ID, conversation.getId());

        verify(conversationRepository).delete(conversation);
        verify(pairService).forgetIfEmpty(USER_ID, "es-ES", "en-US");
    }

    @Test
    void clearsLearnedAtWhenTheSceneIsNoLongerFullyLearned() {
        LanguageConversation conversation = scene("At the pharmacy");
        conversation.setStatus(LanguageSceneStatus.LEARNED);
        conversation.setLearnedAt(Instant.parse("2026-01-01T00:00:00Z"));
        when(conversationRepository.findByIdAndUser_Id(conversation.getId(), USER_ID))
                .thenReturn(Optional.of(conversation));
        when(conversationRepository.save(conversation)).thenReturn(conversation);

        studioService.rate(USER_ID, conversation.getId(), new LanguageStudioRateRequest("GETTING"));

        assertEquals(LanguageSceneStatus.GETTING, conversation.getStatus());
        assertNull(conversation.getLearnedAt());
    }

    @Test
    void learnedContextUsesTheMostRecentScenesInTheSameLanguages() {
        LanguageConversation cafe = scene("Cafe order");
        LanguageTurn you = new LanguageTurn();
        you.setRole(LanguageTurnRole.YOU);
        you.setSpeaker("you");
        you.setNativeText("A coffee, please.");
        you.setTargetText("Un café, s'il vous plaît.");
        LanguageTurn them = new LanguageTurn();
        them.setRole(LanguageTurnRole.THEM);
        them.setSpeaker("barista");
        them.setNativeText("Of course.");
        them.setTargetText("Bien sûr.");
        cafe.setTurns(List.of(them, you));
        ArgumentCaptor<Pageable> page = ArgumentCaptor.forClass(Pageable.class);
        when(conversationRepository
                        .findByUser_IdAndStatusAndNativeLanguageAndTargetLanguageOrderByLearnedAtDescUpdatedAtDesc(
                                eq(USER_ID),
                                eq(LanguageSceneStatus.LEARNED),
                                eq("en-US"),
                                eq("fr-FR"),
                                page.capture()))
                .thenReturn(List.of(cafe));

        String context = studioService.learnedContext(USER_ID, "en-US", "fr-FR");

        assertEquals(LanguageStudioService.LEARNED_CONTEXT_SCENES, page.getValue().getPageSize());
        assertTrue(context.contains("Cafe order"));
        assertTrue(context.contains("[pharmacy, A2]"));
        assertTrue(context.contains("Un café, s'il vous plaît."));
        assertFalse(context.contains("Bien sûr."));
        verify(conversationRepository)
                .findByUser_IdAndStatusAndNativeLanguageAndTargetLanguageOrderByLearnedAtDescUpdatedAtDesc(
                        eq(USER_ID),
                        eq(LanguageSceneStatus.LEARNED),
                        eq("en-US"),
                        eq("fr-FR"),
                        any(Pageable.class));
    }

    @Test
    void inProgressContextUsesRecentScenesThatAreNotFullyLearned() {
        LanguageConversation cafe = scene("Cafe order");
        LanguageTurn you = new LanguageTurn();
        you.setRole(LanguageTurnRole.YOU);
        you.setTargetText("Un café, s'il vous plaît.");
        LanguageTurn them = new LanguageTurn();
        them.setRole(LanguageTurnRole.THEM);
        them.setTargetText("Bien sûr.");
        cafe.setTurns(List.of(them, you));
        ArgumentCaptor<Pageable> page = ArgumentCaptor.forClass(Pageable.class);
        when(conversationRepository
                        .findByUser_IdAndNativeLanguageAndTargetLanguageAndStatusNotOrderByUpdatedAtDesc(
                                eq(USER_ID),
                                eq("en-US"),
                                eq("fr-FR"),
                                eq(LanguageSceneStatus.LEARNED),
                                page.capture()))
                .thenReturn(List.of(cafe));

        String context = studioService.inProgressContext(USER_ID, "en-US", "fr-FR");

        assertEquals(LanguageStudioService.IN_PROGRESS_CONTEXT_SCENES, page.getValue().getPageSize());
        assertTrue(context.contains("Cafe order"));
        assertTrue(context.contains("Un café, s'il vous plaît."));
        assertFalse(context.contains("Bien sûr."));
    }

    @Test
    void historyBlockRecyclesKnownWordsAndAvoidsInProgressScenes() {
        String block = LanguageStudioService.historyBlock(
                "- Cafe order [cafe, A2]\n  Un café, s'il vous plaît.\n",
                "- Airport bag [airport, A2]\n  Où est mon sac ?\n");

        assertTrue(block.contains("still in progress"));
        assertTrue(block.contains("Do not recycle their phrases as known vocabulary"));
        assertTrue(block.contains("Airport bag"));
        assertTrue(block.contains("3 to 6"));
        assertTrue(block.contains("Un café, s'il vous plaît."));
        int inProgressAt = block.indexOf("Airport bag");
        int learnedAt = block.indexOf("Cafe order");
        assertTrue(inProgressAt >= 0 && learnedAt > inProgressAt);
    }

    private LanguageConversation scene(String title) {
        LanguageConversation conversation = new LanguageConversation();
        conversation.setId(UUID.fromString("00000000-0000-0000-0000-000000000033"));
        conversation.setUser(user);
        conversation.setTitle(title);
        conversation.setScenario("pharmacy");
        conversation.setLevel(LanguageLevel.A2);
        conversation.setNativeLanguage("es-ES");
        conversation.setTargetLanguage("en-US");
        conversation.setYourRole("customer");
        conversation.setTheirRole("pharmacist");
        conversation.setStatus(LanguageSceneStatus.LEARNING);
        conversation.setTurns(new ArrayList<>());
        return conversation;
    }

    @Test
    void requiresPro() {
        user.setProLicensed(false);
        ApiException error = assertThrows(ApiException.class, () -> studioService.list(USER_ID, null, null));
        assertEquals(HttpStatus.FORBIDDEN, error.getStatus());
        assertEquals("Pro license required", error.getMessage());
    }

    @Test
    void generateRequiresConfiguredAi() {
        ApiException error = assertThrows(
                ApiException.class,
                () -> studioService.startGenerate(
                        USER_ID, new LanguageStudioCreateRequest("es-ES", "en-US", "cafe", "", "A2", false)));
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, error.getStatus());
        assertEquals("AI is not configured", error.getMessage());
    }

    @Test
    void generateRejectsMatchingLanguages() {
        LanguageStudioService configured = new LanguageStudioService(
                conversationRepository,
                pairService,
                userRepository,
                creditService,
                new AgentProperties("test-key", "", "", 10, 10, 40, 90, 0, 0, 0, 0),
                expiredStoreSubscriptionRefresh);
        ApiException error = assertThrows(
                ApiException.class,
                () -> configured.startGenerate(
                        USER_ID, new LanguageStudioCreateRequest("en-US", "en-US", "cafe", "", "A2", false)));
        assertEquals(HttpStatus.BAD_REQUEST, error.getStatus());
        assertEquals("Choose two different languages", error.getMessage());
    }

    @Test
    void hidesSomeoneElsesConversation() {
        when(conversationRepository.findByIdAndUser_Id(any(), any())).thenReturn(Optional.empty());
        UUID missing = UUID.fromString("00000000-0000-0000-0000-000000000034");
        ApiException error = assertThrows(ApiException.class, () -> studioService.get(USER_ID, missing));
        assertEquals(HttpStatus.NOT_FOUND, error.getStatus());
        assertEquals("Conversation not found", error.getMessage());
    }
}
