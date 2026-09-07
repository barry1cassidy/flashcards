package com.flashcards.card;

import jakarta.validation.constraints.NotBlank;

public record CardRequest(
        @NotBlank String front,
        @NotBlank String back,
        String hint) {
}
