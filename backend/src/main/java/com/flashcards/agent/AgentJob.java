package com.flashcards.agent;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class AgentJob implements AgentProgress {

    public enum State {
        RUNNING,
        DONE,
        FAILED
    }

    private static final Logger log = LoggerFactory.getLogger(AgentJob.class);

    private final UUID id;
    private final UUID userId;
    private final Instant createdAt;
    private final int remainingToday;
    private final List<AgentStepView> steps = new CopyOnWriteArrayList<>();

    private volatile State state = State.RUNNING;
    private volatile AgentCreateResponse result;
    private volatile String error;

    AgentJob(UUID userId, int remainingToday) {
        this.id = UUID.randomUUID();
        this.userId = userId;
        this.createdAt = Instant.now();
        this.remainingToday = remainingToday;
    }

    public UUID id() {
        return id;
    }

    public UUID userId() {
        return userId;
    }

    public Instant createdAt() {
        return createdAt;
    }

    public State state() {
        return state;
    }

    public String lastStepCode() {
        return steps.isEmpty() ? "-" : steps.get(steps.size() - 1).code();
    }

    @Override
    public void step(String code, String detail) {
        String trimmedDetail = detail == null || detail.isBlank() ? null : detail.trim();
        steps.add(new AgentStepView(code, trimmedDetail, Instant.now()));
        if (trimmedDetail == null) {
            log.info("[agent {}] {}", id, code);
        } else {
            log.info("[agent {}] {} {}", id, code, trimmedDetail);
        }
    }

    public synchronized void complete(AgentCreateResponse result) {
        if (state != State.RUNNING) {
            return;
        }
        this.result = result;
        this.state = State.DONE;
        log.info("[agent {}] done deckId={} cards={}", id, result.deckId(), result.cardCount());
    }

    public synchronized void fail(String error) {
        if (state != State.RUNNING) {
            return;
        }
        this.error = error;
        this.state = State.FAILED;
        log.warn("[agent {}] failed: {}", id, error);
    }

    public AgentJobResponse toResponse() {
        int elapsed = (int) Math.max(0, Duration.between(createdAt, Instant.now()).toSeconds());
        return new AgentJobResponse(
                id,
                state.name().toLowerCase(Locale.ROOT),
                elapsed,
                List.copyOf(steps),
                error,
                result,
                result == null ? remainingToday : result.remainingToday());
    }
}
