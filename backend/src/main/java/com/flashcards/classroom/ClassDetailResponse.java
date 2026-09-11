package com.flashcards.classroom;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ClassDetailResponse(
        UUID id,
        String name,
        String role,
        String joinCode,
        String teacherName,
        UUID teacherId,
        long memberCount,
        Instant createdAt,
        Instant updatedAt,
        List<ClassAssignedDeck> decks,
        List<ClassMemberProgress> members) {}
