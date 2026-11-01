package com.flashcards.studio;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ConversationPlaylistRepository extends JpaRepository<ConversationPlaylist, UUID> {

    List<ConversationPlaylist> findByUser_IdOrderByUpdatedAtDesc(UUID userId);

    List<ConversationPlaylist> findByUser_IdAndNativeLanguageAndTargetLanguageOrderByUpdatedAtDesc(
            UUID userId, String nativeLanguage, String targetLanguage);

    Optional<ConversationPlaylist> findByIdAndUser_Id(UUID id, UUID userId);

    boolean existsByUser_IdAndNameIgnoreCase(UUID userId, String name);

    boolean existsByUser_IdAndNameIgnoreCaseAndIdNot(UUID userId, String name, UUID id);

    void deleteByUser_IdAndNativeLanguageAndTargetLanguage(UUID userId, String nativeLanguage, String targetLanguage);
}
