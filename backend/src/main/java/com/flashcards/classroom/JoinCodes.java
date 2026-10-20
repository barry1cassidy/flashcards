package com.flashcards.classroom;

import java.security.SecureRandom;
import java.util.Locale;

public final class JoinCodes {

    static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    static final int LENGTH = 6;
    public static final int SHARE_LENGTH = 8;

    private JoinCodes() {}

    public static String random(SecureRandom random) {
        return randomCode(random, LENGTH);
    }

    public static String randomShare(SecureRandom random) {
        return randomCode(random, SHARE_LENGTH);
    }

    private static String randomCode(SecureRandom random, int length) {
        StringBuilder code = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            code.append(ALPHABET.charAt(random.nextInt(ALPHABET.length())));
        }
        return code.toString();
    }

    public static String normalize(String code) {
        if (code == null) {
            return "";
        }
        return code.trim().toUpperCase(Locale.ROOT);
    }

    public static boolean isWellFormed(String code) {
        return code.length() == LENGTH && usesAlphabet(code);
    }

    public static boolean isShareCode(String code) {
        return (code.length() == LENGTH || code.length() == SHARE_LENGTH) && usesAlphabet(code);
    }

    private static boolean usesAlphabet(String code) {
        for (int i = 0; i < code.length(); i++) {
            if (ALPHABET.indexOf(code.charAt(i)) < 0) {
                return false;
            }
        }
        return true;
    }
}
