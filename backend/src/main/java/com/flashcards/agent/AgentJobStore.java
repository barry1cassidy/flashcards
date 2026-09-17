package com.flashcards.agent;

import java.time.Duration;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

import com.flashcards.security.OwnedAccess;

@Component
public class AgentJobStore {

    private static final Duration RETAIN = Duration.ofMinutes(30);

    private final ConcurrentHashMap<UUID, AgentJob> jobs = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<UUID, Set<UUID>> activeByUser = new ConcurrentHashMap<>();

    public AgentJob create(UUID userId, int remainingCredits) {
        return create(UUID.randomUUID(), userId, remainingCredits);
    }

    public AgentJob create(UUID jobId, UUID userId, int remainingCredits) {
        prune();
        AgentJob job = new AgentJob(jobId, userId, remainingCredits);
        jobs.put(job.id(), job);
        return job;
    }

    public boolean tryBegin(UUID userId, UUID jobId, int remainingCredits) {
        prune();
        boolean[] started = {false};
        activeByUser.compute(userId, (id, current) -> {
            Set<UUID> active = current == null ? ConcurrentHashMap.newKeySet() : current;
            if (remainingCredits - active.size() < 1) {
                return current;
            }
            active.add(jobId);
            started[0] = true;
            return active;
        });
        return started[0];
    }

    public void end(UUID userId, UUID jobId) {
        activeByUser.compute(userId, (id, current) -> {
            if (current == null) {
                return null;
            }
            current.remove(jobId);
            return current.isEmpty() ? null : current;
        });
    }

    public int activeCount(UUID userId) {
        prune();
        Set<UUID> active = activeByUser.get(userId);
        return active == null ? 0 : active.size();
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
        jobs.entrySet().removeIf(entry -> {
            if (!entry.getValue().createdAt().isBefore(cutoff)) {
                return false;
            }
            AgentJob job = entry.getValue();
            end(job.userId(), job.id());
            return true;
        });
    }
}
