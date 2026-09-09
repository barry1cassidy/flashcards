package com.flashcards.agent;

import java.util.List;
import java.util.UUID;

public record AgentJobResponse(
        UUID jobId,
        String state,
        int elapsedSeconds,
        List<AgentStepView> steps,
        String error,
        AgentCreateResponse result,
        int remainingToday) {
}
