package com.flashcards.studio;

import java.time.Instant;
import java.util.UUID;

public record LanguageStudioPairResponse(
        UUID id,
        String nativeLanguage,
        String targetLanguage,
        String level,
        int conversationCount,
        int learnedCount,
        Instant updatedAt) {
}
