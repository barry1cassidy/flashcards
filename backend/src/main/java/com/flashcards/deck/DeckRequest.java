package com.flashcards.deck;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record DeckRequest(
        @NotBlank @Size(max = 200) String name,
        @Size(max = 2000) String description,
        UUID groupId,
        @Size(max = 16) String frontLanguage,
        @Size(max = 16) String backLanguage) {
}
