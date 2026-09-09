package com.flashcards.billing;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.billing")
public record BillingProperties(boolean stubEnabled) {
}
