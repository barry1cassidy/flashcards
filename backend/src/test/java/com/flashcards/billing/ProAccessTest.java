package com.flashcards.billing;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Instant;

import org.junit.jupiter.api.Test;

import com.flashcards.user.User;

class ProAccessTest {

    @Test
    void stubWithoutExpiryIsPro() {
        User user = new User();
        user.setProLicensed(true);
        assertTrue(ProAccess.allowed(user));
    }

    @Test
    void expiredPaidLicenseIsNotPro() {
        User user = new User();
        user.setProLicensed(true);
        user.setProExpiresAt(Instant.now().minusSeconds(60));
        assertFalse(ProAccess.allowed(user));
    }

    @Test
    void paidLicenseBeforeExpiryIsPro() {
        User user = new User();
        user.setProLicensed(true);
        user.setProExpiresAt(Instant.now().plusSeconds(60));
        assertTrue(ProAccess.allowed(user));
    }

    @Test
    void nonAdminCanBePro() {
        User user = new User();
        user.setAdmin(false);
        user.setProLicensed(true);
        assertTrue(ProAccess.allowed(user));
    }
}
