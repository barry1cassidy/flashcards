package com.flashcards.library;

import java.util.List;
import java.util.UUID;

public record LibraryGroupResponse(
        UUID id,
        String slug,
        String name,
        String color,
        String sourceLanguage,
        String targetLanguage,
        String sourceUrl,
        String sourceTitle,
        String attribution,
        long deckCount,
        long cardCount,
        List<LibraryDeckSummary> decks) {
}
