package com.flashcards.share;

import java.util.UUID;

public record ShareAcceptResponse(ShareKind kind, UUID deckId, UUID groupId) {
}
