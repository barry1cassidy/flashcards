package com.flashcards.auth;

import com.flashcards.user.UserLocale;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AppleLoginRequest(
        @NotBlank String identityToken,
        @Pattern(regexp = UserLocale.CODE_PATTERN, message = "Unsupported locale") String locale,
        @Size(max = 100) String fullName) {
}
