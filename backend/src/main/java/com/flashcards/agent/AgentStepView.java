package com.flashcards.agent;

import java.time.Instant;

public record AgentStepView(String code, String detail, Instant at) {
}
