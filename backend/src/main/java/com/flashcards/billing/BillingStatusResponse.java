package com.flashcards.billing;

import java.time.Instant;

public record BillingStatusResponse(
        boolean stripeEnabled,
        boolean stubEnabled,
        boolean proLicensed,
        BillingPlan plan,
        SubscriptionStatus status,
        Instant currentPeriodEnd,
        boolean cancelAtPeriodEnd,
        BillingProvider provider,
        String monthlyPrice,
        String yearlyPrice,
        String addonPrice,
        boolean addonEnabled,
        int includedCredits,
        int addonCredits,
        int remainingCredits,
        int monthlyAllowance,
        int addonPackCredits) {
}
