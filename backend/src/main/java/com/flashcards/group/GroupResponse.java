package com.flashcards.group;

import java.time.Instant;
import java.util.UUID;

public record GroupResponse(
        UUID id,
        String name,
        String color,
        long deckCount,
        Instant createdAt,
        Instant updatedAt) {
}
