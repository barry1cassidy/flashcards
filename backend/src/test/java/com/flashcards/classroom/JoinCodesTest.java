package com.flashcards.classroom;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.security.SecureRandom;

import org.junit.jupiter.api.Test;

class JoinCodesTest {

    @Test
    void randomCodesUseSafeAlphabet() {
        SecureRandom random = new SecureRandom();
        for (int i = 0; i < 50; i++) {
            String code = JoinCodes.random(random);
            assertTrue(JoinCodes.isWellFormed(code), code);
            assertFalse(code.contains("0"));
            assertFalse(code.contains("O"));
            assertFalse(code.contains("1"));
            assertFalse(code.contains("I"));
        }
    }

    @Test
    void normalizeTrimsAndUppercases() {
        assertEquals("K7M2QX", JoinCodes.normalize(" k7m2qx "));
        assertTrue(JoinCodes.isWellFormed("K7M2QX"));
        assertFalse(JoinCodes.isWellFormed("ABC"));
        assertFalse(JoinCodes.isWellFormed("O12345"));
    }
}
