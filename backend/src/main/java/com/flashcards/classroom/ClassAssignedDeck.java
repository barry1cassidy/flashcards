package com.flashcards.classroom;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ClassAssignedDeck(
        UUID deckId,
        String name,
        String description,
        long cardCount,
        UUID copiedDeckId,
        boolean needsUpdate,
        Instant lastStudiedAt,
        long dueCount,
        long learnedCount) {}
