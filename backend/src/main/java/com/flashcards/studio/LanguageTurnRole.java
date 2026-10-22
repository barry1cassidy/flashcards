package com.flashcards.studio;

import org.springframework.http.HttpStatus;

import com.flashcards.common.ApiException;

public enum LanguageTurnRole {
    YOU,
    THEM;

    static LanguageTurnRole from(String value) {
        if (value == null || value.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "The AI did not create a conversation. You were not charged.");
        }
        String normalized = value.trim().toUpperCase();
        if ("YOU".equals(normalized) || "ME".equals(normalized) || "CUSTOMER".equals(normalized)) {
            return YOU;
        }
        if ("THEM".equals(normalized) || "OTHER".equals(normalized) || "PARTNER".equals(normalized)) {
            return THEM;
        }
        try {
            return LanguageTurnRole.valueOf(normalized);
        } catch (IllegalArgumentException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "The AI did not create a conversation. You were not charged.");
        }
    }
}
