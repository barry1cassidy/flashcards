package com.flashcards.billing;

import java.time.Instant;

public record AccountDeletionStatus(
        boolean allowed,
        BillingProvider provider,
        boolean cancelAtPeriodEnd,
        Instant currentPeriodEnd) {

    public static AccountDeletionStatus permitted() {
        return new AccountDeletionStatus(true, null, false, null);
    }
}
