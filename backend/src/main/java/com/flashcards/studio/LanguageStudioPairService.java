package com.flashcards.studio;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.flashcards.billing.ExpiredStoreSubscriptionRefresh;
import com.flashcards.billing.ProAccess;
import com.flashcards.common.ApiException;
import com.flashcards.user.User;
import com.flashcards.user.UserRepository;

@Service
public class LanguageStudioPairService {

    private final LanguageStudioPairRepository pairRepository;
    private final LanguageConversationRepository conversationRepository;
    private final UserRepository userRepository;
    private final ExpiredStoreSubscriptionRefresh expiredStoreSubscriptionRefresh;

    public LanguageStudioPairService(
            LanguageStudioPairRepository pairRepository,
            LanguageConversationRepository conversationRepository,
            UserRepository userRepository,
            ExpiredStoreSubscriptionRefresh expiredStoreSubscriptionRefresh) {
        this.pairRepository = pairRepository;
        this.conversationRepository = conversationRepository;
        this.userRepository = userRepository;
        this.expiredStoreSubscriptionRefresh = expiredStoreSubscriptionRefresh;
    }

    @Transactional(readOnly = true)
    public List<LanguageStudioPairResponse> list(UUID userId) {
        User user = requireProUser(userId);
        return pairRepository.findByUser_IdOrderByUpdatedAtDesc(user.getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public LanguageStudioPair touch(User user, String nativeLanguage, String targetLanguage, LanguageLevel level) {
        LanguageStudioPair pair = pairRepository
                .findByUser_IdAndNativeLanguageAndTargetLanguage(user.getId(), nativeLanguage, targetLanguage)
                .orElseGet(() -> {
                    LanguageStudioPair created = new LanguageStudioPair();
                    created.setUser(user);
                    created.setNativeLanguage(nativeLanguage);
                    created.setTargetLanguage(targetLanguage);
                    return created;
                });
        if (level != null) {
            pair.setLevel(level);
        } else if (pair.getLevel() == null) {
            pair.setLevel(LanguageLevel.A2);
        }
        return pairRepository.save(pair);
    }

    @Transactional
    public void forgetIfEmpty(UUID userId, String nativeLanguage, String targetLanguage) {
        if (conversationRepository.countByUser_IdAndNativeLanguageAndTargetLanguage(
                        userId, nativeLanguage, targetLanguage)
                > 0) {
            return;
        }
        pairRepository
                .findByUser_IdAndNativeLanguageAndTargetLanguage(userId, nativeLanguage, targetLanguage)
                .ifPresent(pairRepository::delete);
    }

    private LanguageStudioPairResponse toResponse(LanguageStudioPair pair) {
        UUID userId = pair.getUser().getId();
        int conversationCount = (int) conversationRepository.countByUser_IdAndNativeLanguageAndTargetLanguage(
                userId, pair.getNativeLanguage(), pair.getTargetLanguage());
        int learnedCount = (int) conversationRepository.countByUser_IdAndNativeLanguageAndTargetLanguageAndStatus(
                userId, pair.getNativeLanguage(), pair.getTargetLanguage(), LanguageSceneStatus.LEARNED);
        return new LanguageStudioPairResponse(
                pair.getId(),
                pair.getNativeLanguage(),
                pair.getTargetLanguage(),
                pair.getLevel().name(),
                conversationCount,
                learnedCount,
                pair.getUpdatedAt());
    }

    private User requireProUser(UUID userId) {
        expiredStoreSubscriptionRefresh.refresh(userId);
        User user = userRepository
                .findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Not authenticated"));
        ProAccess.require(user);
        return user;
    }
}
