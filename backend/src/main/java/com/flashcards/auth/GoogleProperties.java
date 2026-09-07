package com.flashcards.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.google")
public record GoogleProperties(String clientId) {

    public boolean enabled() {
        return clientId != null && !clientId.isBlank();
    }
}
