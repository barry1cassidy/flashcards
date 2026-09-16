package com.flashcards.card;

import org.springframework.http.HttpStatus;

import com.flashcards.common.ApiException;

public enum CardImageSide {
    FRONT,
    BACK;

    public String fileName() {
        return name().toLowerCase() + ".jpg";
    }

    public static CardImageSide fromPath(String value) {
        if (value == null) {
            throw invalid();
        }
        return switch (value.trim().toLowerCase()) {
            case "front" -> FRONT;
            case "back" -> BACK;
            default -> throw invalid();
        };
    }

    private static ApiException invalid() {
        return new ApiException(HttpStatus.BAD_REQUEST, "Invalid card image side");
    }
}
