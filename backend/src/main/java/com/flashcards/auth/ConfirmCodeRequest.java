package com.flashcards.auth;

import jakarta.validation.constraints.NotBlank;

public record ConfirmCodeRequest(@NotBlank String code) {
}
