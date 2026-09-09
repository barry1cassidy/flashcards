package com.flashcards.mix;

import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record StudyMixRequest(
        @NotBlank @Size(max = 80) String name,
        boolean includeAll,
        List<UUID> setIds,
        List<UUID> deckIds) {
}
