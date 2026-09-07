package com.flashcards.auth;

public interface GoogleTokenService {

    GoogleProfile verify(String idToken);

    record GoogleProfile(String subject, String email, String name) {
    }
}
