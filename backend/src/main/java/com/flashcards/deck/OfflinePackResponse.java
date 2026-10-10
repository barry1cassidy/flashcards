package com.flashcards.deck;

import java.util.List;
import java.util.UUID;

public record OfflinePackResponse(
        UUID id,
        String name,
        String description,
        String frontLanguage,
        String backLanguage,
        List<OfflineCardResponse> cards) {
}
