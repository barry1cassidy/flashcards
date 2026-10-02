package com.flashcards.auth;

public final class EmailVerifiedAccess {

    private EmailVerifiedAccess() {
    }

    public static boolean allowedWhileUnverified(String method, String path) {
        if (method == null || path == null) {
            return false;
        }
        String verb = method.toUpperCase();
        if ("OPTIONS".equals(verb)) {
            return true;
        }
        if (path.equals("/api/auth/me") && ("GET".equals(verb) || "PATCH".equals(verb))) {
            return true;
        }
        if (path.equals("/api/auth/verify-email") && "POST".equals(verb)) {
            return true;
        }
        if (path.equals("/api/auth/resend-verification") && "POST".equals(verb)) {
            return true;
        }
        if (path.equals("/api/billing/status") && "GET".equals(verb)) {
            return true;
        }
        if ("GET".equals(verb) && (path.equals("/api/library") || path.startsWith("/api/library/"))) {
            return true;
        }
        if ("GET".equals(verb) && path.startsWith("/api/join/")) {
            return true;
        }
        if ("GET".equals(verb) && path.startsWith("/api/shares/")) {
            return true;
        }
        return false;
    }
}
