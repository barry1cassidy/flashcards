package com.flashcards.studio;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface LanguageStudioPairRepository extends JpaRepository<LanguageStudioPair, UUID> {

    List<LanguageStudioPair> findByUser_IdOrderByUpdatedAtDesc(UUID userId);

    Optional<LanguageStudioPair> findByUser_IdAndNativeLanguageAndTargetLanguage(
            UUID userId, String nativeLanguage, String targetLanguage);
}
