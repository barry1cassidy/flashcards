package com.flashcards.billing;

import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

class AppleJwsVerifierTest {

    private final AppleJwsVerifier verifier = new AppleJwsVerifier();

    @Test
    void rejectsBlankTransaction() {
        assertThrows(IllegalArgumentException.class, () -> verifier.verify(""));
    }

    @Test
    void rejectsMalformedToken() {
        assertThrows(IllegalArgumentException.class, () -> verifier.verify("not-a-jws"));
    }

    @Test
    void rejectsUnsignedThreePartToken() {
        assertThrows(IllegalArgumentException.class, () -> verifier.verify("e30.e30.e30"));
    }
}
