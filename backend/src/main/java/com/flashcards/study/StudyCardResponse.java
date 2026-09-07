package com.flashcards.study;

import java.util.List;
import java.util.UUID;

public record StudyCardResponse(
        UUID id,
        String front,
        String back,
        String hint,
        String frontLanguage,
        String backLanguage,
        List<String> choices) {

    public static StudyCardResponse of(
            UUID id, String front, String back, String hint, String frontLanguage, String backLanguage) {
        return new StudyCardResponse(id, front, back, hint, frontLanguage, backLanguage, List.of());
    }

    public static StudyCardResponse quiz(
            UUID id,
            String front,
            String back,
            String hint,
            String frontLanguage,
            String backLanguage,
            List<String> choices) {
        return new StudyCardResponse(id, front, back, hint, frontLanguage, backLanguage, List.copyOf(choices));
    }
}
