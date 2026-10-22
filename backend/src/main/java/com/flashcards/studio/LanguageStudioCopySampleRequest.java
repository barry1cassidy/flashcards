package com.flashcards.studio;

import jakarta.validation.constraints.NotBlank;

public record LanguageStudioCopySampleRequest(@NotBlank String nativeLanguage, @NotBlank String targetLanguage) {
}
