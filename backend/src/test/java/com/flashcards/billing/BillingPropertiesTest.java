package com.flashcards.billing;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class BillingPropertiesTest {

    private static final String ALLOW =
            "barry1cassidy@gmail.com,barry1cassidy@hotmail.com,barry1cassidy@yahoo.com,*@zipdeck.app";

    @Test
    void allowlistMatchesExactEmailsAndZipdeckDomain() {
        BillingProperties properties = closed(ALLOW);

        assertTrue(properties.paidCheckoutAllowed(false, "barry1cassidy@gmail.com"));
        assertTrue(properties.paidCheckoutAllowed(false, "Barry1Cassidy@Hotmail.com"));
        assertTrue(properties.paidCheckoutAllowed(false, "teacher@zipdeck.app"));
        assertFalse(properties.paidCheckoutAllowed(false, "barry@example.com"));
        assertFalse(properties.paidCheckoutAllowed(false, "cassidy@gmail.com"));
        assertFalse(properties.paidCheckoutAllowed(false, "notzipdeck.app@gmail.com"));
    }

    @Test
    void publicCheckoutOrAdminStillBypassAllowlist() {
        BillingProperties open = new BillingProperties(
                false,
                true,
                "http://localhost:5173",
                "$5.99",
                "$39.99",
                "$2.99",
                null,
                null,
                null,
                "");
        BillingProperties closed = closed("");

        assertTrue(open.paidCheckoutAllowed(false, "anyone@example.com"));
        assertTrue(closed.paidCheckoutAllowed(true, "anyone@example.com"));
        assertFalse(closed.paidCheckoutAllowed(false, "anyone@example.com"));
    }

    private static BillingProperties closed(String allowEmails) {
        return new BillingProperties(
                false,
                false,
                "http://localhost:5173",
                "$5.99",
                "$39.99",
                "$2.99",
                null,
                null,
                null,
                allowEmails);
    }
}
