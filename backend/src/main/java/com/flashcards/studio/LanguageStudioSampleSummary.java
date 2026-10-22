package com.flashcards.studio;

import java.util.UUID;

public record LanguageStudioSampleSummary(
        String slug,
        String scenario,
        String level,
        String title,
        String yourRole,
        String theirRole,
        String nativeLanguage,
        String targetLanguage,
        int turnCount,
        UUID copiedId) {
}
