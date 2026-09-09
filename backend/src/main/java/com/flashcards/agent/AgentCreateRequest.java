package com.flashcards.agent;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AgentCreateRequest(
        @NotBlank @Size(max = 2000) String prompt,
        UUID setId) {
}
