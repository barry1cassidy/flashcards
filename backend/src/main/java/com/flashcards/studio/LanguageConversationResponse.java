package com.flashcards.studio;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record LanguageConversationResponse(
        UUID id,
        String title,
        String scenario,
        String customPrompt,
        String level,
        String nativeLanguage,
        String targetLanguage,
        String yourRole,
        String theirRole,
        String status,
        boolean usedLearned,
        boolean sample,
        String sampleSlug,
        int turnCount,
        List<LanguageTurnResponse> turns,
        Instant ratedAt,
        Instant createdAt,
        Instant updatedAt) {
}
