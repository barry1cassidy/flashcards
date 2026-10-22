package com.flashcards.studio;

import java.util.List;
import java.util.Set;

public final class StudioSampleLanguages {

    public static final String ENGLISH = "en-US";

    public static final List<String> CODES = List.of(
            "en-US",
            "zh-CN",
            "zh-HK",
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
            "ga-IE");

    private static final Set<String> ALLOWED = Set.copyOf(CODES);

    private StudioSampleLanguages() {
    }

    public static boolean supported(String language) {
        return language != null && ALLOWED.contains(language);
    }

    public static boolean supportedPair(String nativeLanguage, String targetLanguage) {
        if (nativeLanguage == null || targetLanguage == null || nativeLanguage.equalsIgnoreCase(targetLanguage)) {
            return false;
        }
        boolean nativeEnglish = ENGLISH.equals(nativeLanguage);
        boolean targetEnglish = ENGLISH.equals(targetLanguage);
        return nativeEnglish != targetEnglish && supported(nativeLanguage) && supported(targetLanguage);
    }
}
