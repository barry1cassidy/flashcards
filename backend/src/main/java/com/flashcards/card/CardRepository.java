package com.flashcards.card;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.flashcards.review.ReviewRating;

public interface CardRepository extends JpaRepository<Card, UUID> {

    List<Card> findByDeckIdOrderByPositionAscIdAsc(UUID deckId);

    Optional<Card> findByIdAndDeckUserId(UUID id, UUID userId);

    int countByDeckId(UUID deckId);

    int countByDeck_IdIn(Collection<UUID> deckIds);

    List<Card> findByDeck_IdIn(Collection<UUID> deckIds);

    @Query("""
            SELECT COUNT(c) FROM Card c
            LEFT JOIN CardReview r ON r.card = c
            WHERE c.deck.id = :deckId
              AND (r.card IS NULL OR r.dueDate <= :today)
            """)
    int countStudyQueue(@Param("deckId") UUID deckId, @Param("today") LocalDate today);

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

    @Query("""
            SELECT c FROM Card c
            JOIN CardReview r ON r.card = c
            WHERE c.deck.id = :deckId AND r.lastRating = :rating
            ORDER BY c.position ASC, c.id ASC
            """)
    List<Card> findHardQueue(
            @Param("deckId") UUID deckId,
            @Param("rating") ReviewRating rating,
            Pageable pageable);

    @Query("""
            SELECT COUNT(c) FROM Card c
            LEFT JOIN CardReview r ON r.card = c
            WHERE c.deck.id IN :deckIds
              AND (r.card IS NULL OR r.dueDate <= :today)
            """)
    int countStudyQueueIn(@Param("deckIds") Collection<UUID> deckIds, @Param("today") LocalDate today);

    @Query("""
            SELECT c FROM Card c
            LEFT JOIN CardReview r ON r.card = c
            WHERE c.deck.id IN :deckIds
              AND (r.card IS NULL OR r.dueDate <= :today)
            ORDER BY CASE WHEN r.card IS NULL THEN 1 ELSE 0 END, r.dueDate ASC, c.position ASC, c.id ASC
            """)
    List<Card> findStudyQueueIn(
            @Param("deckIds") Collection<UUID> deckIds,
            @Param("today") LocalDate today,
            Pageable pageable);

    @Query("""
            SELECT c FROM Card c
            JOIN CardReview r ON r.card = c
            WHERE c.deck.id IN :deckIds AND r.lastRating = :rating
            ORDER BY c.position ASC, c.id ASC
            """)
    List<Card> findHardQueueIn(
            @Param("deckIds") Collection<UUID> deckIds,
            @Param("rating") ReviewRating rating,
            Pageable pageable);
}
