package com.flashcards.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, message = "Password must be at least 8 characters") String password,
        @NotBlank @Size(max = 100) String displayName,
        @Pattern(regexp = "(?i)en|es|en-[A-Za-z]+|es-[A-Za-z]+", message = "Unsupported locale") String locale) {
}
