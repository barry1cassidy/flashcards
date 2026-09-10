package com.flashcards.billing;

import org.springframework.http.HttpStatus;

import com.flashcards.common.ApiException;
import com.flashcards.user.User;

public final class ProAccess {

    private ProAccess() {
    }

    public static boolean allowed(User user) {
        return user != null && user.isAdmin() && user.isProLicensed();
    }

    public static void require(User user) {
        if (!allowed(user)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Pro license required");
        }
    }
}
