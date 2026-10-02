package com.flashcards.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record VerifyEmailRequest(
        @NotBlank @Pattern(regexp = "\\d{6}", message = "That code is wrong or has expired") String code) {
}
