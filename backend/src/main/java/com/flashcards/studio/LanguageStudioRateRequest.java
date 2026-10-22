package com.flashcards.studio;

import jakarta.validation.constraints.NotBlank;

public record LanguageStudioRateRequest(@NotBlank String status) {
}
