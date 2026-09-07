package com.flashcards.user;

public enum UserLocale {
    EN,
    ES;

    public static UserLocale fromCode(String value) {
        if (value == null || value.isBlank()) {
            return EN;
        }
        String normalized = value.trim().toLowerCase();
        if (normalized.equals("es") || normalized.startsWith("es-")) {
            return ES;
        }
        if (normalized.equals("en") || normalized.startsWith("en-")) {
            return EN;
        }
        try {
            return UserLocale.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return EN;
        }
    }

    public String toCode() {
        return this == ES ? "es" : "en";
    }
}
