package com.flashcards.billing;

import java.time.Instant;

public record PlayPurchaseRecord(
        String productId,
        String purchaseToken,
        String orderId,
        String obfuscatedAccountId,
        boolean subscription,
        boolean active,
        boolean acknowledged,
        boolean consumed,
        Instant expiryTime,
        boolean cancelAtPeriodEnd) {
}
