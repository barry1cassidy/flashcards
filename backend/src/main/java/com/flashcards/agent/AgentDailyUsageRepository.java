package com.flashcards.agent;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AgentDailyUsageRepository extends JpaRepository<AgentDailyUsage, AgentDailyUsageId> {

    Optional<AgentDailyUsage> findByUserIdAndUsageDate(UUID userId, LocalDate usageDate);
}
