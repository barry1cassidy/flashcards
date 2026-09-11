package com.flashcards.classroom;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ClassSummary(
        UUID id,
        String name,
        String role,
        String joinCode,
        String teacherName,
        long memberCount,
        long deckCount,
        Instant createdAt,
        Instant updatedAt) {}
