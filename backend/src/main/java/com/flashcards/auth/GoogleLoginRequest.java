package com.flashcards.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record GoogleLoginRequest(
        @NotBlank String idToken,
        @Pattern(regexp = "(?i)en|es|en-[A-Za-z]+|es-[A-Za-z]+", message = "Unsupported locale") String locale) {
}
