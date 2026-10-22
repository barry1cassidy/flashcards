package com.flashcards.studio;

import org.springframework.http.HttpStatus;

import com.flashcards.common.ApiException;

public enum LanguageSceneStatus {
    LEARNING,
    GETTING,
    READY,
    LEARNED;

    static LanguageSceneStatus from(String value) {
        if (value == null || value.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Choose how the conversation went");
        }
        try {
            return LanguageSceneStatus.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Choose how the conversation went");
        }
    }
}
