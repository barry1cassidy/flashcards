package com.flashcards.auth;

import java.util.LinkedHashSet;
import java.util.Set;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.apple")
public record AppleProperties(String audience, String webAudience) {

    public boolean enabled() {
        return audience != null && !audience.isBlank();
    }

    public Set<String> audiences() {
        LinkedHashSet<String> values = new LinkedHashSet<>();
        add(values, audience);
        add(values, webAudience);
        return Set.copyOf(values);
    }

    private static void add(Set<String> values, String value) {
        if (value != null && !value.isBlank()) {
            values.add(value.trim());
        }
    }
}
