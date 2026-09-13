package com.flashcards.security;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import com.flashcards.common.ApiException;
import com.flashcards.user.User;

class SubscriptionAccessTest {

    private final UUID ownerId = UUID.fromString("00000000-0000-0000-0000-000000000011");
    private final UUID otherId = UUID.fromString("00000000-0000-0000-0000-000000000012");

    @Test
    void ownerCanViewOwnSubscription() {
        User owner = user(ownerId, false);
        assertDoesNotThrow(() -> SubscriptionAccess.requireOwnerOrAdmin(owner, ownerId));
    }

    @Test
    void adminCanViewAnotherUsersSubscription() {
        User admin = user(otherId, true);
        assertDoesNotThrow(() -> SubscriptionAccess.requireOwnerOrAdmin(admin, ownerId));
    }

    @Test
    void otherUserCannotViewSubscription() {
        User other = user(otherId, false);
        ApiException ex = assertThrows(ApiException.class, () -> SubscriptionAccess.requireOwnerOrAdmin(other, ownerId));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
        assertEquals("Admin required", ex.getMessage());
    }

    private static User user(UUID id, boolean admin) {
        User user = new User();
        user.setId(id);
        user.setAdmin(admin);
        return user;
    }
}
