package com.flashcards.studio;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import com.flashcards.billing.ExpiredStoreSubscriptionRefresh;
import com.flashcards.common.ApiException;
import com.flashcards.user.User;
import com.flashcards.user.UserRepository;

@ExtendWith(MockitoExtension.class)
class LanguageStudioCatalogServiceTest {

    private static final UUID USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000041");

    @Mock
    private StudioSampleSceneRepository sceneRepository;
    @Mock
    private LanguageConversationRepository conversationRepository;
    @Mock
    private LanguageStudioPairService pairService;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ExpiredStoreSubscriptionRefresh expiredStoreSubscriptionRefresh;

    private LanguageStudioCatalogService catalogService;
    private User user;

    @BeforeEach
    void setUp() {
        catalogService = new LanguageStudioCatalogService(
                sceneRepository, conversationRepository, pairService, userRepository, expiredStoreSubscriptionRefresh);
        user = new User();
        user.setId(USER_ID);
        user.setProLicensed(true);
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
    }

    @Test
    void samplesAreToAndFromEnglish() {
        ApiException error = assertThrows(ApiException.class, () -> catalogService.list(USER_ID, "es-ES", "fr-FR"));
        assertEquals(HttpStatus.BAD_REQUEST, error.getStatus());
        assertEquals("Samples are to and from English", error.getMessage());
    }

    @Test
    void copyRequiresPro() {
        user.setProLicensed(false);
        ApiException error =
                assertThrows(ApiException.class, () -> catalogService.copy(USER_ID, "pharmacy", "ga-IE", "en-US"));
        assertEquals(HttpStatus.FORBIDDEN, error.getStatus());
        assertEquals("Pro license required", error.getMessage());
    }

    @Test
    void listRequiresPro() {
        user.setProLicensed(false);
        ApiException error = assertThrows(ApiException.class, () -> catalogService.list(USER_ID, "en-US", "ga-IE"));
        assertEquals(HttpStatus.FORBIDDEN, error.getStatus());
        assertEquals("Pro license required", error.getMessage());
    }

    @Test
    void getRequiresPro() {
        user.setProLicensed(false);
        ApiException error =
                assertThrows(ApiException.class, () -> catalogService.get(USER_ID, "pharmacy", "en-US", "ga-IE"));
        assertEquals(HttpStatus.FORBIDDEN, error.getStatus());
        assertEquals("Pro license required", error.getMessage());
    }
}
