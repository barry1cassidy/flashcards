package com.flashcards.study;

import java.time.LocalDate;
import java.util.List;

import com.flashcards.user.StudyOrder;
import com.flashcards.user.StudyScope;

public record StudySessionResponse(
        String mode,
        List<StudyCardResponse> cards,
        LocalDate nextDueDate,
        StudyScope studyScope,
        StudyOrder studyOrder,
        int cardCount,
        int dueCount,
        int waitingCount,
        int hardCount,
        int againCount,
        String filter) {
}
