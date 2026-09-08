package com.flashcards.deck;

import java.time.Instant;
import java.util.UUID;

public record DeckResponse(
        UUID id,
        String name,
        String description,
        GroupSummary group,
        String frontLanguage,
        String backLanguage,
        Instant createdAt,
        Instant updatedAt,
        long cardCount,
        long dueCount,
        long learnedCount,
        Instant lastStudiedAt,
        long hardCount,
        long againCount) {
}
