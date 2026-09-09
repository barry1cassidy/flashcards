package com.flashcards.agent;

@FunctionalInterface
public interface AgentProgress {

    void step(String code, String detail);

    static AgentProgress noop() {
        return (code, detail) -> {
        };
    }
}
