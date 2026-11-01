package com.flashcards.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Set;

import org.junit.jupiter.api.Test;

import com.flashcards.common.ApiException;

class AppleSignInTokenTest {

    private static final String ABC_HASH = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";

    @Test
    void nonceMatchesSha256OfTheRawValue() {
        assertTrue(AppleNonce.matches("abc", ABC_HASH));
        assertTrue(AppleNonce.matches("abc", ABC_HASH.toUpperCase()));
        assertFalse(AppleNonce.matches("abd", ABC_HASH));
        assertFalse(AppleNonce.matches(null, ABC_HASH));
        assertFalse(AppleNonce.matches("abc", null));
    }

    @Test
    void acceptsIosBundleOrWebServicesId() {
        Set<String> allowed = new AppleProperties("com.zipdeck.app", "com.zipdeck.web").audiences();
        assertTrue(AppleIdTokenService.audienceAllowed(Set.of("com.zipdeck.app"), allowed));
        assertTrue(AppleIdTokenService.audienceAllowed(Set.of("com.zipdeck.web"), allowed));
        assertFalse(AppleIdTokenService.audienceAllowed(Set.of("com.example.other"), allowed));
        assertFalse(AppleIdTokenService.audienceAllowed(Set.of(), allowed));
    }

    @Test
    void webTokenRequiresNonceAndIosTokenDoesNot() {
        assertFalse(AppleIdTokenService.webNonceRequired(Set.of("com.zipdeck.app"), "com.zipdeck.app", "com.zipdeck.web"));
        assertTrue(AppleIdTokenService.webNonceRequired(Set.of("com.zipdeck.web"), "com.zipdeck.app", "com.zipdeck.web"));
        assertFalse(AppleIdTokenService.webNonceRequired(Set.of("com.zipdeck.app"), "com.zipdeck.app", "com.zipdeck.app"));

        AppleIdTokenService.requireNonce(null, null, false);

        ApiException missing = assertThrows(
                ApiException.class, () -> AppleIdTokenService.requireNonce(null, null, true));
        assertEquals("Invalid Apple sign-in", missing.getMessage());

        ApiException wrong = assertThrows(
                ApiException.class, () -> AppleIdTokenService.requireNonce("abd", ABC_HASH, true));
        assertEquals("Invalid Apple sign-in", wrong.getMessage());

        AppleIdTokenService.requireNonce("abc", ABC_HASH, true);
    }
}
