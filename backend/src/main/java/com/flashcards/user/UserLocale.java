package com.flashcards.user;

import java.util.Locale;

public enum UserLocale {
    EN("en", "en-US"),
    ZH("zh", "zh-CN"),
    HI("hi", "hi-IN"),
    ES("es", "es-ES"),
    AR("ar", "ar-SA"),
    FR("fr", "fr-FR"),
    BN("bn", "bn-IN"),
    PT("pt", "pt-BR"),
    RU("ru", "ru-RU"),
    ID("id", "id-ID"),
    DE("de", "de-DE"),
    JA("ja", "ja-JP"),
    TR("tr", "tr-TR"),
    VI("vi", "vi-VN"),
    KO("ko", "ko-KR"),
    IT("it", "it-IT"),
    TH("th", "th-TH"),
    PL("pl", "pl-PL"),
    NL("nl", "nl-NL"),
    UK("uk", "uk-UA");

    public static final String CODE_PATTERN =
            "(?i)(en|zh|hi|es|ar|fr|bn|pt|ru|id|de|ja|tr|vi|ko|it|th|pl|nl|uk)(-[A-Za-z]+)?";

    private final String code;
    private final String speechCode;

    UserLocale(String code, String speechCode) {
        this.code = code;
        this.speechCode = speechCode;
    }

    public static UserLocale fromCode(String value) {
        if (value == null || value.isBlank()) {
            return EN;
        }
        String normalized = value.trim().toLowerCase(Locale.ROOT).replace('_', '-');
        for (UserLocale locale : values()) {
            if (normalized.equals(locale.code) || normalized.startsWith(locale.code + "-")) {
                return locale;
            }
        }
        try {
            return UserLocale.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            return EN;
        }
    }

    public String toCode() {
        return code;
    }

    public String speechCode() {
        return speechCode;
    }
}
