package com.flashcards.auth;

import com.flashcards.user.UserLocale;
import com.flashcards.user.DeckSort;
import com.flashcards.user.RestudyWait;
import com.flashcards.user.StudyOrder;
import com.flashcards.user.StudyScope;
import com.flashcards.user.Theme;

import jakarta.validation.constraints.Pattern;

public record UpdateMeRequest(
        Theme theme,
        @Pattern(regexp = UserLocale.CODE_PATTERN, message = "Unsupported locale") String locale,
        DeckSort deckSort,
        StudyOrder studyOrder,
        StudyScope studyScope,
        RestudyWait restudyWait,
        Boolean teacherMode) {
}
