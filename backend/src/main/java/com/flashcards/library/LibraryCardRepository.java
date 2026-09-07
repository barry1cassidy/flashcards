package com.flashcards.library;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LibraryCardRepository extends JpaRepository<LibraryCard, UUID> {

    List<LibraryCard> findByDeckIdOrderByPositionAscIdAsc(UUID deckId);

    int countByDeckId(UUID deckId);

    @Query("SELECT c.deck.id, COUNT(c) FROM LibraryCard c WHERE c.deck.id IN :deckIds GROUP BY c.deck.id")
    List<Object[]> countByDeckIds(@Param("deckIds") Collection<UUID> deckIds);
}
