package com.flashcards.studio;

import java.util.List;
import java.util.UUID;

public record LanguageStudioSampleResponse(
        String slug,
        String scenario,
        String level,
        String title,
        String yourRole,
        String theirRole,
        String nativeLanguage,
        String targetLanguage,
        int turnCount,
        UUID copiedId,
        List<LanguageTurnResponse> turns) {
}
