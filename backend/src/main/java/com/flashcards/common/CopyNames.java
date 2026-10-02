package com.flashcards.common;

import java.util.UUID;
import java.util.function.Predicate;

public final class CopyNames {

    public static final int DECK = 200;
    public static final int SET = 80;

    private CopyNames() {
    }

    public static String unique(String base, int maxLen, Predicate<String> taken) {
        String trimmed = base == null || base.isBlank() ? "Untitled" : base.trim();
        String first = clip(trimmed, maxLen);
        if (!taken.test(first)) {
            return first;
        }
        for (int i = 1; i < 200; i++) {
            String suffix = " (copy " + i + ")";
            String candidate = clip(trimmed, Math.max(1, maxLen - suffix.length())) + suffix;
            if (candidate.length() > maxLen) {
                candidate = clip(candidate, maxLen);
            }
            if (!taken.test(candidate)) {
                return candidate;
            }
        }
        String extra = " " + UUID.randomUUID().toString().substring(0, 8);
        return clip(trimmed, Math.max(1, maxLen - extra.length())) + extra;
    }

    private static String clip(String value, int maxLen) {
        if (value.length() <= maxLen) {
            return value;
        }
        return value.substring(0, Math.max(1, maxLen)).trim();
    }
}
