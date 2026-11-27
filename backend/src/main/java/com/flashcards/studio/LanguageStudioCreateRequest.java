package com.flashcards.studio;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LanguageStudioCreateRequest(
        @NotBlank String nativeLanguage,
        @NotBlank String targetLanguage,
        @NotBlank String scenario,
        @Size(max = 240) String customPrompt,
        @NotBlank String level,
        boolean useLearned,
        String length,
        @Size(max = 3) List<UUID> sourceIds,
        @Size(max = 4, message = "Keep the word list shorter") List<@Valid StudioTerm> terms) {
}
