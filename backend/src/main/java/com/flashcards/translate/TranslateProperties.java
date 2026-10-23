package com.flashcards.translate;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.translate")
public record TranslateProperties(String url, Azure azure) {

    public record Azure(String key, String region, String endpoint) {
    }

    /** Base URL for the paused LibreTranslate container. See README. */
    public String libreBaseUrl() {
        String value = url == null || url.isBlank() ? "http://localhost:5000" : url.trim();
        while (value.endsWith("/")) {
            value = value.substring(0, value.length() - 1);
        }
        return value;
    }

    public String azureKey() {
        if (azure == null || azure.key == null) {
            return "";
        }
        return azure.key.trim();
    }

    public String azureRegion() {
        if (azure == null || azure.region == null) {
            return "";
        }
        return azure.region.trim();
    }

    public String azureEndpoint() {
        String value = azure == null || azure.endpoint == null || azure.endpoint.isBlank()
                ? "https://api.cognitive.microsofttranslator.com"
                : azure.endpoint.trim();
        while (value.endsWith("/")) {
            value = value.substring(0, value.length() - 1);
        }
        return value;
    }
}
