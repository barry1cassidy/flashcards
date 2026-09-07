package com.flashcards.library;

import java.util.List;
import java.util.UUID;

import com.flashcards.card.CardResponse;

public record LibraryDeckResponse(
        UUID id,
        String slug,
        String name,
        String description,
        int position,
        String sourceLanguage,
        String targetLanguage,
        LibraryGroupRef group,
        UUID copiedDeckId,
        List<CardResponse> cards) {
}
