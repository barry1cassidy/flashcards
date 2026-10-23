package com.flashcards.translate;

import java.util.Map;

/**
 * Speech codes the deck already stores, mapped to Azure Translator language codes.
 * Simplified and traditional Chinese stay distinct. Welsh and Swahili are included.
 */
public final class TranslationLanguages {

    private static final Map<String, String> AZURE = Map.ofEntries(
            Map.entry("en-US", "en"),
            Map.entry("zh-CN", "zh-Hans"),
            Map.entry("zh-HK", "zh-Hant"),
            Map.entry("hi-IN", "hi"),
            Map.entry("es-ES", "es"),
            Map.entry("ar-SA", "ar"),
            Map.entry("fr-FR", "fr"),
            Map.entry("bn-IN", "bn"),
            Map.entry("pt-BR", "pt"),
            Map.entry("ru-RU", "ru"),
            Map.entry("id-ID", "id"),
            Map.entry("de-DE", "de"),
            Map.entry("ja-JP", "ja"),
            Map.entry("tr-TR", "tr"),
            Map.entry("vi-VN", "vi"),
            Map.entry("ko-KR", "ko"),
            Map.entry("it-IT", "it"),
            Map.entry("th-TH", "th"),
            Map.entry("pl-PL", "pl"),
            Map.entry("nl-NL", "nl"),
            Map.entry("uk-UA", "uk"),
            Map.entry("sv-SE", "sv"),
            Map.entry("el-GR", "el"),
            Map.entry("he-IL", "he"),
            Map.entry("ga-IE", "ga"),
            Map.entry("da-DK", "da"),
            Map.entry("fi-FI", "fi"),
            Map.entry("cs-CZ", "cs"),
            Map.entry("ro-RO", "ro"),
            Map.entry("tl-PH", "fil"),
            Map.entry("sw-KE", "sw"),
            Map.entry("cy-GB", "cy"),
            Map.entry("nb-NO", "nb"),
            Map.entry("hu-HU", "hu"));

    private TranslationLanguages() {
    }

    public static String azureCode(String speechCode) {
        if (speechCode == null) {
            return null;
        }
        return AZURE.get(speechCode);
    }

    public static boolean canTranslate(String frontLanguage, String backLanguage) {
        String source = azureCode(frontLanguage);
        String target = azureCode(backLanguage);
        return source != null && target != null && !source.equals(target);
    }
}
