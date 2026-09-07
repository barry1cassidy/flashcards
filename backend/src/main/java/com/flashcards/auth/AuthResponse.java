package com.flashcards.auth;

public record AuthResponse(String token, UserResponse user) {
}
