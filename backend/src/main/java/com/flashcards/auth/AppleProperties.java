package com.flashcards.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.apple")
public record AppleProperties(String audience) {

    public boolean enabled() {
        return audience != null && !audience.isBlank();
    }
}
