package com.flashcards.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Locale;

final class AppleNonce {

    private AppleNonce() {
    }

    static boolean matches(String rawNonce, String claim) {
        if (rawNonce == null || rawNonce.isBlank() || claim == null || claim.isBlank()) {
            return false;
        }
        String expected = sha256Hex(rawNonce);
        String actual = claim.trim().toLowerCase(Locale.ROOT);
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                actual.getBytes(StandardCharsets.UTF_8));
    }

    static String sha256Hex(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(digest.length * 2);
            for (byte item : digest) {
                hex.append(String.format("%02x", Byte.toUnsignedInt(item)));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException(ex);
        }
    }
}
