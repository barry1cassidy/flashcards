package com.flashcards.studio;

import java.util.List;
import java.util.UUID;

public record ConversationPlaylistListenResponse(
        UUID id,
        String name,
        String nativeLanguage,
        String targetLanguage,
        List<LanguageConversationResponse> conversations) {
}
