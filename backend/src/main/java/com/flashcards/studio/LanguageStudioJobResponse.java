package com.flashcards.studio;

import java.util.List;
import java.util.UUID;

import com.flashcards.agent.AgentStepView;

public record LanguageStudioJobResponse(
        UUID jobId,
        String state,
        int elapsedSeconds,
        List<AgentStepView> steps,
        String error,
        LanguageConversationResponse conversation,
        int remainingCredits) {
}
