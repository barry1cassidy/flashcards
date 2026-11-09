package com.flashcards.auth;

public final class NativeClient {

    public static final String HEADER = "X-Zipdeck-Client";

    private NativeClient() {
    }

    public static boolean isNative(String header) {
        return "native".equals(header);
    }
}
