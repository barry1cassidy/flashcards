package com.flashcards.studio;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.flashcards.billing.ExpiredStoreSubscriptionRefresh;
import com.flashcards.user.User;
import com.flashcards.user.UserRepository;

@ExtendWith(MockitoExtension.class)
class LanguageStudioPairServiceTest {

    private static final UUID USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000051");

    @Mock
    private LanguageStudioPairRepository pairRepository;
    @Mock
    private LanguageConversationRepository conversationRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ExpiredStoreSubscriptionRefresh expiredStoreSubscriptionRefresh;

    private LanguageStudioPairService pairService;
    private User user;

    @BeforeEach
    void setUp() {
        pairService = new LanguageStudioPairService(
                pairRepository, conversationRepository, userRepository, expiredStoreSubscriptionRefresh);
        user = new User();
        user.setId(USER_ID);
        user.setProLicensed(true);
        lenient().when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
    }

    @Test
    void listsPairsWithCountsForThatLanguagePairOnly() {
        LanguageStudioPair pair = new LanguageStudioPair();
        pair.setId(UUID.fromString("00000000-0000-0000-0000-000000000052"));
        pair.setUser(user);
        pair.setNativeLanguage("en-US");
        pair.setTargetLanguage("es-ES");
        pair.setLevel(LanguageLevel.A2);
        when(pairRepository.findByUser_IdOrderByUpdatedAtDesc(USER_ID)).thenReturn(List.of(pair));
        when(conversationRepository.countByUser_IdAndNativeLanguageAndTargetLanguage(USER_ID, "en-US", "es-ES"))
                .thenReturn(3L);
        when(conversationRepository.countByUser_IdAndNativeLanguageAndTargetLanguageAndStatus(
                        USER_ID, "en-US", "es-ES", LanguageSceneStatus.LEARNED))
                .thenReturn(1L);

        List<LanguageStudioPairResponse> rows = pairService.list(USER_ID);

        assertEquals(1, rows.size());
        assertEquals("en-US", rows.get(0).nativeLanguage());
        assertEquals("es-ES", rows.get(0).targetLanguage());
        assertEquals("A2", rows.get(0).level());
        assertEquals(3, rows.get(0).conversationCount());
        assertEquals(1, rows.get(0).learnedCount());
    }

    @Test
    void touchCreatesAPairForNewLanguages() {
        when(pairRepository.findByUser_IdAndNativeLanguageAndTargetLanguage(USER_ID, "en-US", "fr-FR"))
                .thenReturn(Optional.empty());
        when(pairRepository.save(any(LanguageStudioPair.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LanguageStudioPair saved = pairService.touch(user, "en-US", "fr-FR", LanguageLevel.B1);

        assertEquals("en-US", saved.getNativeLanguage());
        assertEquals("fr-FR", saved.getTargetLanguage());
        assertEquals(LanguageLevel.B1, saved.getLevel());
    }
}
