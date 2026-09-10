package com.flashcards.billing;

import org.springframework.http.HttpStatus;

import com.flashcards.common.ApiException;
import com.flashcards.user.User;

public final class AdminAccess {

    private AdminAccess() {
    }

    public static void require(User user) {
        if (user == null || !user.isAdmin()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Admin required");
        }
    }
}
