package com.flashcards.mail;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.mail")
public record MailProperties(String resendApiKey, String from) {

    public boolean enabled() {
        return resendApiKey != null && !resendApiKey.isBlank();
    }

    public String fromHeader() {
        if (from != null && !from.isBlank()) {
            return from.trim();
        }
        return "Zipdeck <onboarding@resend.dev>";
    }
}
