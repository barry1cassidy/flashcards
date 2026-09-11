package com.flashcards.classroom;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ClassMemberProgress(
        UUID userId,
        String displayName,
        String email,
        Instant joinedAt,
        List<ClassMemberDeckProgress> decks) {}
