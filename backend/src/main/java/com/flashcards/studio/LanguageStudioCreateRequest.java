package com.flashcards.studio;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LanguageStudioCreateRequest(
        @NotBlank String nativeLanguage,
        @NotBlank String targetLanguage,
        @NotBlank String scenario,
        @Size(max = 240) String customPrompt,
        @NotBlank String level,
        boolean useLearned) {
}
