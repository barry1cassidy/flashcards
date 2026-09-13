package com.flashcards.admin;

import java.time.Instant;

import com.flashcards.billing.BillingPlan;
import com.flashcards.billing.BillingProvider;
import com.flashcards.billing.SubscriptionStatus;

public record AdminSubscriptionResponse(
        BillingProvider provider,
        String providerCustomerId,
        String providerSubscriptionId,
        BillingPlan plan,
        SubscriptionStatus status,
        Instant currentPeriodEnd,
        boolean cancelAtPeriodEnd,
        Instant updatedAt) {
}
