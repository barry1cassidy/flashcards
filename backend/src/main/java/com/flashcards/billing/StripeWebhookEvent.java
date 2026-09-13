package com.flashcards.billing;

public record StripeWebhookEvent(String type, String checkoutSessionId, String subscriptionId) {
}
