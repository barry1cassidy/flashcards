package com.flashcards.agent;

public record AgentStatusResponse(
        boolean proRequired,
        boolean configured,
        int remainingToday,
        int dailyLimit) {
}
