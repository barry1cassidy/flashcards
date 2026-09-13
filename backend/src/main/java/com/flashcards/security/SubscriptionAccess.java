package com.flashcards.security;

import java.util.UUID;

import org.springframework.http.HttpStatus;

import com.flashcards.common.ApiException;
import com.flashcards.user.User;

public final class SubscriptionAccess {

    private SubscriptionAccess() {
    }

    public static void requireOwnerOrAdmin(User actor, UUID ownerId) {
        if (actor == null || ownerId == null) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Admin required");
        }
        if (ownerId.equals(actor.getId()) || actor.isAdmin()) {
            return;
        }
        throw new ApiException(HttpStatus.FORBIDDEN, "Admin required");
    }
}
