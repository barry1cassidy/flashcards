package com.flashcards.billing;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Instant;

import org.junit.jupiter.api.Test;

class BillingAccountDeletionTest {

    @Test
    void activeStoreSubscriptionBlocksDeletion() {
        assertTrue(BillingService.blocksAccountDeletion(subscription(BillingProvider.STRIPE, SubscriptionStatus.ACTIVE, Instant.now().plusSeconds(3600)), Instant.now()));
        assertTrue(BillingService.blocksAccountDeletion(subscription(BillingProvider.GOOGLE, SubscriptionStatus.TRIALING, Instant.now().plusSeconds(3600)), Instant.now()));
        assertTrue(BillingService.blocksAccountDeletion(subscription(BillingProvider.APPLE, SubscriptionStatus.PAST_DUE, null), Instant.now()));
    }

    @Test
    void canceledOrExpiredStoreSubscriptionAllowsDeletion() {
        Instant now = Instant.now();
        assertFalse(BillingService.blocksAccountDeletion(subscription(BillingProvider.STRIPE, SubscriptionStatus.CANCELED, now.plusSeconds(3600)), now));
        assertFalse(BillingService.blocksAccountDeletion(subscription(BillingProvider.APPLE, SubscriptionStatus.ACTIVE, now.minusSeconds(60)), now));
        assertFalse(BillingService.blocksAccountDeletion(subscription(BillingProvider.ADMIN, SubscriptionStatus.ACTIVE, now.plusSeconds(3600)), now));
        UserSubscription addon = subscription(BillingProvider.STRIPE, SubscriptionStatus.ACTIVE, now.plusSeconds(3600));
        addon.setPlan(BillingPlan.ADDON);
        assertFalse(BillingService.blocksAccountDeletion(addon, now));
    }

    private static UserSubscription subscription(BillingProvider provider, SubscriptionStatus status, Instant periodEnd) {
        UserSubscription row = new UserSubscription();
        row.setProvider(provider);
        row.setPlan(BillingPlan.MONTHLY);
        row.setStatus(status);
        row.setCurrentPeriodEnd(periodEnd);
        return row;
    }
}
