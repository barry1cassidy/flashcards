package com.flashcards.security;

import java.util.UUID;

public record UserPrincipal(UUID id, String email, String displayName) {
}
