package com.flashcards.card;

import java.util.UUID;

public record CardResponse(UUID id, String front, String back, String hint, int position) {
}
