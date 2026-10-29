package com.flashcards.auth;

public interface AppleTokenService {

    AppleProfile verify(String identityToken);

    record AppleProfile(String subject, String email) {
    }
}
