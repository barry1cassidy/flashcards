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
        int timeoutSeconds,
        int maxPromptChars,
        int maxPdfBytes,
        int maxPdfPages,
        int maxPdfChars) {

    public AgentProperties {
        apiKey = apiKey == null ? "" : apiKey;
        baseUrl = (baseUrl == null || baseUrl.isBlank())
                ? "https://generativelanguage.googleapis.com/v1beta/openai"
                : baseUrl;
        model = (model == null || model.isBlank()) ? "gemini-3.8-flash" : model;
        monthlyCredits = monthlyCredits <= 0 ? 10 : monthlyCredits;
        addonCredits = addonCredits <= 0 ? 10 : addonCredits;
        maxCards = maxCards <= 0 ? 40 : maxCards;
        timeoutSeconds = timeoutSeconds <= 0 ? 90 : timeoutSeconds;
        maxPromptChars = maxPromptChars <= 0 ? 2000 : maxPromptChars;
        maxPdfBytes = maxPdfBytes <= 0 ? 8 * 1024 * 1024 : maxPdfBytes;
        maxPdfPages = maxPdfPages <= 0 ? 30 : maxPdfPages;
        maxPdfChars = maxPdfChars <= 0 ? 40_000 : maxPdfChars;
    }

    public boolean configured() {
        return apiKey != null && !apiKey.isBlank();
    }
}
