package com.flashcards.studio;

import java.util.Locale;

import org.springframework.http.HttpStatus;

import com.flashcards.common.ApiException;

enum ConversationLength {
    QUICK(7, 9, "Write 8 turns. Never fewer than 7 or more than 9."),
    FULL(10, 12, "Write 12 turns. Never fewer than 10 or more than 12.");

    private final int minTurns;
    private final int maxTurns;
    private final String instruction;

    ConversationLength(int minTurns, int maxTurns, String instruction) {
        this.minTurns = minTurns;
        this.maxTurns = maxTurns;
        this.instruction = instruction;
    }

    int minTurns() {
        return minTurns;
    }

    int maxTurns() {
        return maxTurns;
    }

    String instruction() {
        return instruction;
    }

    int wordCap() {
        return this == QUICK ? 2 : 4;
    }

    static ConversationLength fromOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Choose a conversation length");
        }
    }
}
