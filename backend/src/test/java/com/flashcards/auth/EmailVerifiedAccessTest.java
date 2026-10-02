package com.flashcards.auth;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class EmailVerifiedAccessTest {

    @Test
    void allowsVerifyAndLibraryGets() {
        assertTrue(EmailVerifiedAccess.allowedWhileUnverified("GET", "/api/auth/me"));
        assertTrue(EmailVerifiedAccess.allowedWhileUnverified("PATCH", "/api/auth/me"));
        assertTrue(EmailVerifiedAccess.allowedWhileUnverified("POST", "/api/auth/verify-email"));
        assertTrue(EmailVerifiedAccess.allowedWhileUnverified("POST", "/api/auth/resend-verification"));
        assertTrue(EmailVerifiedAccess.allowedWhileUnverified("GET", "/api/library"));
        assertTrue(EmailVerifiedAccess.allowedWhileUnverified("GET", "/api/library/decks/1"));
        assertTrue(EmailVerifiedAccess.allowedWhileUnverified("GET", "/api/billing/status"));
        assertTrue(EmailVerifiedAccess.allowedWhileUnverified("GET", "/api/join/ABC123"));
        assertTrue(EmailVerifiedAccess.allowedWhileUnverified("OPTIONS", "/api/decks"));
    }

    @Test
    void blocksProductWrites() {
        assertFalse(EmailVerifiedAccess.allowedWhileUnverified("GET", "/api/decks"));
        assertFalse(EmailVerifiedAccess.allowedWhileUnverified("POST", "/api/library/decks/1/add"));
        assertFalse(EmailVerifiedAccess.allowedWhileUnverified("POST", "/api/billing/checkout"));
        assertFalse(EmailVerifiedAccess.allowedWhileUnverified("POST", "/api/agent/jobs"));
        assertFalse(EmailVerifiedAccess.allowedWhileUnverified("GET", "/api/mixes"));
    }
}
