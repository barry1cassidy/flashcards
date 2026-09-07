package com.flashcards.card;

import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.http.HttpStatus;

import com.flashcards.common.ApiException;
import com.flashcards.user.UserLocale;

public final class CardLanguages {

    public static final String DEFAULT = "en-US";

    public static final List<String> CODES = List.of(
            "en-US",
            "zh-CN",
            "hi-IN",
            "es-ES",
            "ar-SA",
            "fr-FR",
            "bn-IN",
            "pt-BR",
            "ru-RU",
            "id-ID",
            "de-DE",
            "ja-JP",
            "tr-TR",
            "vi-VN",
            "ko-KR",
            "it-IT",
            "th-TH",
            "pl-PL",
            "nl-NL",
            "uk-UA",
            "sv-SE",
            "el-GR",
            "he-IL");

    private static final Set<String> ALLOWED = Set.copyOf(CODES);

    private CardLanguages() {
    }

    public static String fromUserLocale(UserLocale locale) {
        return locale == UserLocale.ES ? "es-ES" : DEFAULT;
    }

    public static String normalize(String value, String fallback) {
        String base = fallback == null || fallback.isBlank() ? DEFAULT : fallback;
        if (value == null || value.isBlank()) {
            return requireKnown(base, base);
        }
        String normalized = value.trim().replace('_', '-');
        if (ALLOWED.contains(normalized)) {
            return normalized;
        }
        String language = normalized.split("-", 2)[0].toLowerCase(Locale.ROOT);
        for (String code : CODES) {
            if (code.toLowerCase(Locale.ROOT).startsWith(language + "-") || code.equalsIgnoreCase(language)) {
                return code;
            }
        }
        throw new ApiException(HttpStatus.BAD_REQUEST, "Unsupported language");
    }

    public static String normalizeOrFallback(String value, String fallback) {
        try {
            return normalize(value, fallback);
        } catch (ApiException ex) {
            return requireKnown(fallback, DEFAULT);
        }
    }

    private static String requireKnown(String value, String fallback) {
        if (ALLOWED.contains(value)) {
            return value;
        }
        return ALLOWED.contains(fallback) ? fallback : DEFAULT;
    }
}
