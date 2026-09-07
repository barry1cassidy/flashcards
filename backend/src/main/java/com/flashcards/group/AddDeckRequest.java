package com.flashcards.group;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AddDeckRequest(@NotNull UUID deckId) {
}
