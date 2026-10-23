package com.flashcards.studio;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LanguageConversationRepository extends JpaRepository<LanguageConversation, UUID> {

    List<LanguageConversation> findByUser_IdOrderByUpdatedAtDesc(UUID userId);

    List<LanguageConversation> findByUser_IdAndNativeLanguageAndTargetLanguageOrderByUpdatedAtDesc(
            UUID userId, String nativeLanguage, String targetLanguage);

    long countByUser_IdAndNativeLanguageAndTargetLanguage(UUID userId, String nativeLanguage, String targetLanguage);

    long countByUser_IdAndNativeLanguageAndTargetLanguageAndStatus(
            UUID userId, String nativeLanguage, String targetLanguage, LanguageSceneStatus status);

    List<LanguageConversation> findByUser_IdAndStatusAndNativeLanguageAndTargetLanguageOrderByLearnedAtDescUpdatedAtDesc(
            UUID userId,
            LanguageSceneStatus status,
            String nativeLanguage,
            String targetLanguage,
            Pageable pageable);

    List<LanguageConversation> findByUser_IdAndNativeLanguageAndTargetLanguageAndStatusNotOrderByUpdatedAtDesc(
            UUID userId,
            String nativeLanguage,
            String targetLanguage,
            LanguageSceneStatus status,
            Pageable pageable);

    Optional<LanguageConversation> findByIdAndUser_Id(UUID id, UUID userId);

    Optional<LanguageConversation> findByUser_IdAndSampleScene_IdAndNativeLanguageAndTargetLanguage(
            UUID userId, UUID sampleSceneId, String nativeLanguage, String targetLanguage);
}
