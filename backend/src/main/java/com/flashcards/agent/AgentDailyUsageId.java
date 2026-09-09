package com.flashcards.agent;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.UUID;

public record AgentDailyUsageId(UUID userId, LocalDate usageDate) implements Serializable {
}
