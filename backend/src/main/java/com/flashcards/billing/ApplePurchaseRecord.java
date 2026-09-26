package com.flashcards.billing;

import java.time.Instant;

public record ApplePurchaseRecord(
        String productId,
        String originalTransactionId,
        String transactionId,
        String appAccountToken,
        boolean subscription,
        boolean active,
        Instant expiryTime,
        boolean cancelAtPeriodEnd) {
}
