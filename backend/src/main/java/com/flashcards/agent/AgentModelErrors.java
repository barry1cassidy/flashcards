package com.flashcards.agent;

import java.util.Locale;

final class AgentModelErrors {

    static final String BUSY = "The AI is busy right now. You were not charged. Try again in a minute.";
    static final String QUOTA = "The AI is out of quota for today. You were not charged. Try again tomorrow.";
    static final String FAILED = "Could not create the deck. You were not charged. Try again.";
    static final String NO_DECK = "The AI did not create a deck. You were not charged.";
    static final String NO_CARDS =
            "The AI didn't add any cards. You were not charged. Try again with a short prompt that names both languages, or set Front and Back Language.";
    static final int MAX_ATTEMPTS = 3;

    private AgentModelErrors() {
    }

    static boolean isQuota(Throwable error) {
        for (Throwable current = error; current != null; current = current.getCause()) {
            String message = current.getMessage() == null ? "" : current.getMessage().toLowerCase(Locale.ROOT);
            if (message.contains("quota")
                    || message.contains("resource_exhausted")
                    || message.contains("resource exhausted")
                    || message.contains("exceeded your current quota")
                    || message.contains("free_tier")) {
                return true;
            }
        }
        return false;
    }

    static boolean isBusy(Throwable error) {
        if (isQuota(error)) {
            return false;
        }
        for (Throwable current = error; current != null; current = current.getCause()) {
            int status = leadingStatus(current.getMessage());
            if (status == 502 || status == 503 || status == 504) {
                return true;
            }
            String message = current.getMessage() == null ? "" : current.getMessage().toLowerCase(Locale.ROOT);
            if (message.contains("high demand")
                    || message.contains("\"status\":\"unavailable\"")
                    || message.contains("overloaded")
                    || message.contains("try again later")) {
                return true;
            }
        }
        return false;
    }

    static String userMessage(Throwable error) {
        if (isQuota(error)) {
            return QUOTA;
        }
        return isBusy(error) ? BUSY : FAILED;
    }

    static long retryWaitMs(int attempt) {
        return 2000L * attempt;
    }

    private static int leadingStatus(String message) {
        if (message == null || message.length() < 3) {
            return 0;
        }
        int index = 0;
        while (index < message.length() && Character.isDigit(message.charAt(index))) {
            index++;
        }
        if (index == 0) {
            return 0;
        }
        if (index < message.length() && message.charAt(index) != ':' && message.charAt(index) != ' ') {
            return 0;
        }
        try {
            return Integer.parseInt(message.substring(0, index));
        } catch (NumberFormatException ex) {
            return 0;
        }
    }
}
