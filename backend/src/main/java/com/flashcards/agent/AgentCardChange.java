package com.flashcards.agent;

import java.util.UUID;

public record AgentCardChange(
        UUID cardId,
        int position,
        String beforeFront,
        String beforeBack,
        String beforeHint,
        String afterFront,
        String afterBack,
        String afterHint) {
}
