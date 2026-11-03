package com.flashcards.analytics;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.posthog")
public record PostHogProperties(String apiKey, String host) {

    public boolean enabled() {
        return apiKey != null && !apiKey.isBlank();
    }

    public String captureUrl() {
        String base = host == null || host.isBlank() ? "https://us.i.posthog.com" : host.trim();
        while (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        return base + "/capture/";
    }
}
