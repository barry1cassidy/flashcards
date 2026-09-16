package com.flashcards.card;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.card-images")
public record CardImageProperties(
        String storage,
        String dir,
        String bucket,
        String region,
        String endpoint,
        String prefix,
        int maxBytes,
        int maxEdge) {

    public CardImageProperties {
        storage = (storage == null || storage.isBlank()) ? "local" : storage.trim().toLowerCase();
        dir = (dir == null || dir.isBlank()) ? "./data/card-images" : dir.trim();
        bucket = bucket == null ? "" : bucket.trim();
        region = (region == null || region.isBlank()) ? "us-east-1" : region.trim();
        endpoint = endpoint == null ? "" : endpoint.trim();
        prefix = normalizePrefix(prefix);
        maxBytes = maxBytes <= 0 ? 5 * 1024 * 1024 : maxBytes;
        maxEdge = maxEdge <= 0 ? 1600 : maxEdge;
    }

    public boolean s3() {
        return "s3".equals(storage);
    }

    private static String normalizePrefix(String prefix) {
        if (prefix == null || prefix.isBlank()) {
            return "card-images";
        }
        String trimmed = prefix.trim();
        while (trimmed.startsWith("/")) {
            trimmed = trimmed.substring(1);
        }
        while (trimmed.endsWith("/")) {
            trimmed = trimmed.substring(0, trimmed.length() - 1);
        }
        return trimmed.isEmpty() ? "card-images" : trimmed;
    }
}
