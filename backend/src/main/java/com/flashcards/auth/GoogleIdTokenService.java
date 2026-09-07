package com.flashcards.auth;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.flashcards.common.ApiException;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;

@Service
public class GoogleIdTokenService implements GoogleTokenService {

    private final GoogleIdTokenVerifier verifier;

    public GoogleIdTokenService(GoogleProperties properties) {
        if (!properties.enabled()) {
            this.verifier = null;
            return;
        }
        try {
            this.verifier = new GoogleIdTokenVerifier.Builder(
                    GoogleNetHttpTransport.newTrustedTransport(),
                    GsonFactory.getDefaultInstance())
                    .setAudience(List.of(properties.clientId().trim()))
                    .build();
        } catch (GeneralSecurityException | IOException ex) {
            throw new IllegalStateException("Could not create Google ID token verifier", ex);
        }
    }

    @Override
    public GoogleProfile verify(String idToken) {
        if (verifier == null) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Google sign-in is not configured");
        }
        GoogleIdToken token;
        try {
            token = verifier.verify(idToken);
        } catch (GeneralSecurityException | IOException | IllegalArgumentException ex) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid Google sign-in");
        }
        if (token == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid Google sign-in");
        }
        GoogleIdToken.Payload payload = token.getPayload();
        if (!Boolean.TRUE.equals(payload.getEmailVerified())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Google email is not verified");
        }
        String email = payload.getEmail();
        if (email == null || email.isBlank()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid Google sign-in");
        }
        String name = payload.get("name") instanceof String value ? value : "";
        return new GoogleProfile(payload.getSubject(), email, name);
    }
}
