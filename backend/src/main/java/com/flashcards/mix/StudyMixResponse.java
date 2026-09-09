package com.flashcards.mix;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record StudyMixResponse(
        UUID id,
        String name,
        boolean includeAll,
        List<UUID> setIds,
        List<UUID> deckIds,
        int deckCount,
        int cardCount,
        int dueCount,
        int hardCount,
        int againCount,
        Instant createdAt,
        Instant updatedAt) {
}
