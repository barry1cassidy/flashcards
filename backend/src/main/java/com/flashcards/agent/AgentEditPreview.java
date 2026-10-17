package com.flashcards.agent;

import java.util.List;
import java.util.UUID;

public record AgentEditPreview(
        UUID deckId,
        String deckName,
        int unchangedCount,
        List<AgentCardChange> changes) {
}
