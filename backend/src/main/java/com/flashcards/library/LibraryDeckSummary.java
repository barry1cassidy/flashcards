package com.flashcards.library;

import java.util.UUID;

public record LibraryDeckSummary(
        UUID id,
        String slug,
        String name,
        String description,
        int position,
        long cardCount,
        UUID copiedDeckId) {
}
