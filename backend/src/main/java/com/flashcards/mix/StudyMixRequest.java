package com.flashcards.mix;

import java.util.List;
import java.util.UUID;

import com.flashcards.user.StudyOrder;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record StudyMixRequest(
        @NotBlank @Size(max = 80) String name,
        boolean includeAll,
        StudyOrder studyOrder,
        List<UUID> setIds,
        List<UUID> deckIds) {
}
