package com.flashcards.agent;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.agent")
public record AgentProperties(
        String apiKey,
        String baseUrl,
        String model,
        int monthlyCredits,
        int addonCredits,
        int maxCards,
        int timeoutSeconds) {

    public AgentProperties {
        apiKey = apiKey == null ? "" : apiKey;
        baseUrl = (baseUrl == null || baseUrl.isBlank())
                ? "https://generativelanguage.googleapis.com/v1beta/openai"
                : baseUrl;
        model = (model == null || model.isBlank()) ? "gemini-3.6-flash" : model;
        monthlyCredits = monthlyCredits <= 0 ? 40 : monthlyCredits;
        addonCredits = addonCredits <= 0 ? 40 : addonCredits;
        maxCards = maxCards <= 0 ? 40 : maxCards;
        timeoutSeconds = timeoutSeconds <= 0 ? 90 : timeoutSeconds;
    }

    public boolean configured() {
        return apiKey != null && !apiKey.isBlank();
    }
}
