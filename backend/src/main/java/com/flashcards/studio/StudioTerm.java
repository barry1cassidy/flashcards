package com.flashcards.studio;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record StudioTerm(
        @NotBlank @Size(max = 80) String nativeText,
        @NotBlank @Size(max = 80) String targetText) {
}
