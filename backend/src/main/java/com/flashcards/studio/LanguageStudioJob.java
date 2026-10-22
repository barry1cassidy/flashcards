package com.flashcards.studio;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.flashcards.agent.AgentStepView;

final class LanguageStudioJob {

    enum State {
        RUNNING,
        DONE,
        FAILED
    }

    private static final Logger log = LoggerFactory.getLogger(LanguageStudioJob.class);

    private final UUID id;
    private final UUID userId;
    private final Instant createdAt;
    private final int remainingCredits;
    private final List<AgentStepView> steps = new CopyOnWriteArrayList<>();

    private volatile State state = State.RUNNING;
    private volatile LanguageConversationResponse conversation;
    private volatile Integer settledCredits;
    private volatile String error;

    LanguageStudioJob(UUID id, UUID userId, int remainingCredits) {
        this.id = id;
        this.userId = userId;
        this.createdAt = Instant.now();
        this.remainingCredits = remainingCredits;
    }

    UUID id() {
        return id;
    }

    UUID userId() {
        return userId;
    }

    Instant createdAt() {
        return createdAt;
    }

    State state() {
        return state;
    }

    void step(String code) {
        steps.add(new AgentStepView(code, null, Instant.now()));
        log.info("[studio {}] {}", id, code);
    }

    synchronized void complete(LanguageConversationResponse conversation, int remainingCredits) {
        if (state != State.RUNNING) {
            return;
        }
        this.conversation = conversation;
        this.settledCredits = remainingCredits;
        this.state = State.DONE;
        log.info("[studio {}] done conversationId={}", id, conversation.id());
    }

    synchronized void fail(String error) {
        if (state != State.RUNNING) {
            return;
        }
        this.error = error;
        this.state = State.FAILED;
        log.warn("[studio {}] failed: {}", id, error);
    }

    LanguageStudioJobResponse toResponse() {
        int elapsed = (int) Math.max(0, Duration.between(createdAt, Instant.now()).toSeconds());
        int credits = settledCredits != null ? settledCredits : remainingCredits;
        return new LanguageStudioJobResponse(
                id,
                state.name().toLowerCase(Locale.ROOT),
                elapsed,
                List.copyOf(steps),
                error,
                conversation,
                credits);
    }
}
