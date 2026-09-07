package com.flashcards.card;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CardRepository extends JpaRepository<Card, UUID> {

    List<Card> findByDeckIdOrderByPositionAscIdAsc(UUID deckId);

    Optional<Card> findByIdAndDeckUserId(UUID id, UUID userId);

    int countByDeckId(UUID deckId);

    @Query("""
            SELECT c FROM Card c
            LEFT JOIN CardReview r ON r.card = c
            WHERE c.deck.id = :deckId
              AND (r.card IS NULL OR r.dueDate <= :today)
            ORDER BY CASE WHEN r.card IS NULL THEN 1 ELSE 0 END, r.dueDate ASC, c.position ASC, c.id ASC
            """)
    List<Card> findStudyQueue(
            @Param("deckId") UUID deckId,
            @Param("today") LocalDate today,
            Pageable pageable);
}
