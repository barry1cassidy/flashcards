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
        List<String> choices,
        int hardDays,
        int goodDays,
        int easyDays) {

    public static StudyCardResponse of(
            UUID id,
            String front,
            String back,
            String hint,
            String frontLanguage,
            String backLanguage,
            int hardDays,
            int goodDays,
            int easyDays) {
        return new StudyCardResponse(
                id, front, back, hint, frontLanguage, backLanguage, List.of(), hardDays, goodDays, easyDays);
    }

    public static StudyCardResponse quiz(
            UUID id,
            String front,
            String back,
            String hint,
            String frontLanguage,
            String backLanguage,
            List<String> choices,
            int hardDays,
            int goodDays,
            int easyDays) {
        return new StudyCardResponse(
                id,
                front,
                back,
                hint,
                frontLanguage,
                backLanguage,
                List.copyOf(choices),
                hardDays,
                goodDays,
                easyDays);
    }
}
