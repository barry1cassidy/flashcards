package com.flashcards.auth;

import com.flashcards.user.UserLocale;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record GoogleLoginRequest(
        @NotBlank String idToken,
        @Pattern(regexp = UserLocale.CODE_PATTERN, message = "Unsupported locale") String locale) {
}
