package com.flashcards.billing;

import java.time.Instant;
import java.util.Map;

public record StripeSnapshot(
        String customerId,
        String subscriptionId,
        String status,
        String priceId,
        Instant currentPeriodEnd,
        boolean cancelAtPeriodEnd,
        Map<String, String> metadata) {
}
