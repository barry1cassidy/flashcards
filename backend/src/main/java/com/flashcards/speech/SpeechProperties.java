package com.flashcards.speech;

import java.net.URI;
import java.nio.file.Path;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.speech")
public record SpeechProperties(String key, String region, String cacheDir, String endpoint, long maxBytes) {

    static final long DEFAULT_MAX_BYTES = 100L * 1024 * 1024;

    public long cacheLimit() {
        return maxBytes > 0 ? maxBytes : DEFAULT_MAX_BYTES;
    }

    public String key() {
        if (key == null) {
            return "";
        }
        return key.trim();
    }

    public String region() {
        if (region == null) {
            return "";
        }
        return region.trim().toLowerCase();
    }

    public Path cachePath() {
        String value = cacheDir == null || cacheDir.isBlank() ? "./data/speech-cache" : cacheDir.trim();
        return Path.of(value);
    }

    public URI speechEndpoint() {
        if (endpoint != null && !endpoint.isBlank()) {
            return URI.create(endpoint.trim());
        }
        String name = region();
        if (!name.matches("[a-z0-9]+")) {
            return null;
        }
        return URI.create("https://" + name + ".tts.speech.microsoft.com/cognitiveservices/v1");
    }
}
