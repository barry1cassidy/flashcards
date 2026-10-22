package com.flashcards.studio;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface LanguageConversationRepository extends JpaRepository<LanguageConversation, UUID> {

    List<LanguageConversation> findByUser_IdOrderByUpdatedAtDesc(UUID userId);

    List<LanguageConversation> findByUser_IdAndStatusOrderByUpdatedAtDesc(UUID userId, LanguageSceneStatus status);

    Optional<LanguageConversation> findByIdAndUser_Id(UUID id, UUID userId);

    Optional<LanguageConversation> findByUser_IdAndSampleScene_IdAndNativeLanguageAndTargetLanguage(
            UUID userId, UUID sampleSceneId, String nativeLanguage, String targetLanguage);
}
