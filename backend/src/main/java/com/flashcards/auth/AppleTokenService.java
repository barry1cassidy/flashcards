package com.flashcards.auth;

public interface AppleTokenService {

    AppleProfile verify(String identityToken, String rawNonce);

    record AppleProfile(String subject, String email) {
    }
}
