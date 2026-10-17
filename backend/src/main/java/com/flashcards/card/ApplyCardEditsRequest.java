package com.flashcards.card;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ApplyCardEditsRequest(
        @NotEmpty
        @Size(max = 80, message = "This deck has too many cards to edit in one pass")
        List<@Valid CardEdit> cards) {

    public record CardEdit(
            @NotNull UUID cardId,
            @NotBlank String front,
            @NotBlank String back,
            String hint) {
    }
}
