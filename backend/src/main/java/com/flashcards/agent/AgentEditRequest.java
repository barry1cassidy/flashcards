package com.flashcards.agent;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AgentEditRequest(
        @NotBlank(message = "Describe what should change")
        @Size(max = 2000, message = "Prompt is over the 2000 character limit")
        String instruction,
        UUID jobId) {
}
