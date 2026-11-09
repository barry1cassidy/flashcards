package com.flashcards.auth;

public record AuthResponse(String token, UserResponse user, boolean newAccount, String refreshToken) {

    public AuthResponse(String token, UserResponse user, boolean newAccount) {
        this(token, user, newAccount, null);
    }
}
