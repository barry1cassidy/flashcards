package com.flashcards.group;

import java.util.List;

import com.flashcards.deck.DeckResponse;

public record GroupDetailResponse(GroupResponse group, List<DeckResponse> decks) {
}
