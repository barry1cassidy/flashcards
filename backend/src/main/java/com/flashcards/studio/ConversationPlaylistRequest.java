package com.flashcards.studio;

import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ConversationPlaylistRequest(
        @NotBlank @Size(max = 80) String name,
        @NotBlank @Size(max = 16) String nativeLanguage,
        @NotBlank @Size(max = 16) String targetLanguage,
        boolean includeAll,
        List<UUID> conversationIds) {
}
