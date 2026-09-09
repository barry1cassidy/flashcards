package com.flashcards.agent;

import java.util.UUID;

public record AgentCreateResponse(
        String message,
        UUID deckId,
        UUID setId,
        int cardCount,
        int remainingToday) {
}
