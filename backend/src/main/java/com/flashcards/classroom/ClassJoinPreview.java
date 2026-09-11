package com.flashcards.classroom;

public record ClassJoinPreview(
        String name, String teacherName, String joinCode, long deckCount, long memberCount) {}
