package com.flashcards.studio;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
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
                userRepository,
                creditService,
                new AgentProperties("", "", "", 10, 10, 40, 90, 0, 0, 0, 0),
                expiredStoreSubscriptionRefresh);
        user = new User();
        user.setId(USER_ID);
        user.setProLicensed(true);
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
    }

    @Test
    void ratesTheWholeScene() {
        LanguageConversation conversation = new LanguageConversation();
        conversation.setId(UUID.fromString("00000000-0000-0000-0000-000000000033"));
        conversation.setUser(user);
        conversation.setTitle("At the pharmacy");
        conversation.setScenario("pharmacy");
        conversation.setLevel(LanguageLevel.A2);
        conversation.setNativeLanguage("es-ES");
        conversation.setTargetLanguage("en-US");
        conversation.setYourRole("customer");
        conversation.setTheirRole("pharmacist");
        conversation.setStatus(LanguageSceneStatus.LEARNING);
        conversation.setTurns(new ArrayList<>());
        when(conversationRepository.findByIdAndUser_Id(conversation.getId(), USER_ID))
                .thenReturn(Optional.of(conversation));
        when(conversationRepository.save(conversation)).thenReturn(conversation);

        LanguageConversationResponse response =
                studioService.rate(USER_ID, conversation.getId(), new LanguageStudioRateRequest("LEARNED"));

        assertEquals("LEARNED", response.status());
        assertEquals(LanguageSceneStatus.LEARNED, conversation.getStatus());
    }

    @Test
    void requiresPro() {
        user.setProLicensed(false);
        ApiException error = assertThrows(ApiException.class, () -> studioService.list(USER_ID));
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
