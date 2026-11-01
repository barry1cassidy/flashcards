package com.flashcards.studio;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ConversationPlaylistItemRepository extends JpaRepository<ConversationPlaylistItem, UUID> {

    List<ConversationPlaylistItem> findByPlaylist_IdOrderByPositionAsc(UUID playlistId);
}
