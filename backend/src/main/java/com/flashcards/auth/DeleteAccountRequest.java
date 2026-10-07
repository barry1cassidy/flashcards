package com.flashcards.auth;

public record DeleteAccountRequest(String password, String confirmation) {
}
