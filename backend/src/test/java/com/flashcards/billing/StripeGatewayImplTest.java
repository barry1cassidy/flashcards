package com.flashcards.billing;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class StripeGatewayImplTest {

    @Test
    void cancelAtPeriodEndFlagSchedulesEnd() {
        assertTrue(StripeGatewayImpl.cancelsAtPeriodEnd(true, null, null));
    }

    @Test
    void cancelAtWithoutEndedAtSchedulesEnd() {
        assertTrue(StripeGatewayImpl.cancelsAtPeriodEnd(false, 1_793_162_975L, null));
    }

    @Test
    void activeSubscriptionIsNotScheduledToEnd() {
        assertFalse(StripeGatewayImpl.cancelsAtPeriodEnd(false, null, null));
        assertFalse(StripeGatewayImpl.cancelsAtPeriodEnd(null, null, null));
    }

    @Test
    void endedSubscriptionIsNotScheduledToEnd() {
        assertFalse(StripeGatewayImpl.cancelsAtPeriodEnd(false, 1_793_162_975L, 1_793_162_975L));
    }
}
