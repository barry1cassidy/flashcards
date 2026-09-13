package com.flashcards.billing;

import java.util.Map;

public record StripeCheckoutSession(
        String id,
        String url,
        String customerId,
        String subscriptionId,
        String clientReferenceId,
        String paymentStatus,
        Map<String, String> metadata) {

    boolean addonPurchase() {
        if (metadata == null) {
            return false;
        }
        return "ADDON".equalsIgnoreCase(metadata.get("plan"));
    }

    boolean paid() {
        return "paid".equalsIgnoreCase(paymentStatus) || "no_payment_required".equalsIgnoreCase(paymentStatus);
    }
}
