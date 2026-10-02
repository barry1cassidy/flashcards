package com.flashcards.share;

import java.util.UUID;

public record SharePreviewResponse(
        ShareKind kind,
        String code,
        String name,
        String ownerName,
        int deckCount,
        int cardCount,
        boolean ownShare,
        UUID existingDeckId,
        UUID existingGroupId) {
}
