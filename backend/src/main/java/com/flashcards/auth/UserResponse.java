package com.flashcards.auth;

import java.util.UUID;

import com.flashcards.user.DeckSort;
import com.flashcards.user.RestudyWait;
import com.flashcards.user.StudyOrder;
import com.flashcards.user.StudyScope;
import com.flashcards.user.Theme;

public record UserResponse(
        UUID id,
        String email,
        String displayName,
        Theme theme,
        String locale,
        DeckSort deckSort,
        StudyOrder studyOrder,
        StudyScope studyScope,
        RestudyWait restudyWait,
        boolean proLicensed) {
}
