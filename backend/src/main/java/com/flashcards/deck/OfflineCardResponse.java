package com.flashcards.deck;

import java.util.UUID;

public record OfflineCardResponse(UUID id, String front, String back, String hint, int position) {
}
