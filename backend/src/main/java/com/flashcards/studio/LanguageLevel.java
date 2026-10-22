package com.flashcards.studio;

import org.springframework.http.HttpStatus;

import com.flashcards.common.ApiException;

public enum LanguageLevel {
    A1,
    A2,
    B1,
    B2,
    C1;

    static LanguageLevel from(String value) {
        if (value == null || value.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Choose a fluency level");
        }
        try {
            return LanguageLevel.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Choose a fluency level");
        }
    }
}
