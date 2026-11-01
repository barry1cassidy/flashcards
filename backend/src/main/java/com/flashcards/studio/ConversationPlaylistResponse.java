package com.flashcards.studio;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ConversationPlaylistResponse(
        UUID id,
        String name,
        boolean includeAll,
        String nativeLanguage,
        String targetLanguage,
        List<UUID> conversationIds,
        int conversationCount,
        int turnCount,
        Instant createdAt,
        Instant updatedAt) {
}
