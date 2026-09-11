package com.flashcards.agent;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

import com.flashcards.security.OwnedAccess;

@Component
public class AgentJobStore {

    private static final Duration RETAIN = Duration.ofMinutes(30);

    private final ConcurrentHashMap<UUID, AgentJob> jobs = new ConcurrentHashMap<>();

    public AgentJob create(UUID userId, int remainingToday) {
        prune();
        AgentJob job = new AgentJob(userId, remainingToday);
        jobs.put(job.id(), job);
        return job;
    }

    public AgentJob require(UUID userId, UUID jobId) {
        prune();
        AgentJob job = jobs.get(jobId);
        if (job == null || !job.userId().equals(userId)) {
            throw OwnedAccess.hidden("Agent job not found");
        }
        return job;
    }

    private void prune() {
        Instant cutoff = Instant.now().minus(RETAIN);
        jobs.entrySet().removeIf(entry -> entry.getValue().createdAt().isBefore(cutoff));
    }
}
