package com.flashcards.billing;

import java.time.Instant;

import org.springframework.http.HttpStatus;

import com.flashcards.common.ApiException;
import com.flashcards.user.User;

public final class ProAccess {

    private ProAccess() {
    }

    public static boolean allowed(User user) {
        if (user == null || !user.isProLicensed()) {
            return false;
        }
        return user.getProExpiresAt() == null || !user.getProExpiresAt().isBefore(Instant.now());
    }

    public static void require(User user) {
        if (!allowed(user)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Pro license required");
        }
    }
}
