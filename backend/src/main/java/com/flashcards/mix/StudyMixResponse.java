package com.flashcards.mix;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.flashcards.user.StudyOrder;

public record StudyMixResponse(
        UUID id,
        String name,
        boolean includeAll,
        StudyOrder studyOrder,
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
