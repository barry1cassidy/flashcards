package com.flashcards.billing;

import org.springframework.http.HttpStatus;

import com.flashcards.common.ApiException;
import com.flashcards.user.User;

public final class ProAccess {

    private ProAccess() {
    }

    public static void require(User user) {
        if (user == null || !user.isProLicensed()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Pro license required");
        }
    }
}
