package com.flashcards.card;

import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.NotEmpty;

public record ReorderCardsRequest(@NotEmpty List<UUID> cardIds) {
}
