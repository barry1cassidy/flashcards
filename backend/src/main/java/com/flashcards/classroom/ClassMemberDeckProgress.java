package com.flashcards.classroom;

import java.time.Instant;
import java.util.UUID;

public record ClassMemberDeckProgress(
        UUID deckId,
        String name,
        boolean copied,
        Instant lastStudiedAt,
        long dueCount,
        long learnedCount) {}
