package com.flashcards.auth;

import com.flashcards.user.UserLocale;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, message = "Password must be at least 8 characters") String password,
        @NotBlank @Size(max = 100) String displayName,
        @Pattern(regexp = UserLocale.CODE_PATTERN, message = "Unsupported locale") String locale) {
}
