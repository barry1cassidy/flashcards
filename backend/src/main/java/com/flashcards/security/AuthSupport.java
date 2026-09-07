package com.flashcards.security;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;

import com.flashcards.common.ApiException;

public final class AuthSupport {

    private AuthSupport() {
    }

    public static UserPrincipal requireUser(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        return principal;
    }
}
