package com.flashcards.classroom;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

public record AssignDeckRequest(@NotNull UUID deckId) {}
