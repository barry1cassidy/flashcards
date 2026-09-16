package com.flashcards.agent;

import java.util.UUID;

import jakarta.validation.constraints.Size;

public record AgentCreateRequest(
        @Size(max = 2000, message = "Prompt is over the 2000 character limit") String prompt,
        UUID setId,
        String frontLanguage,
        String backLanguage) {
}
