package com.flashcards.review;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CardReviewRepository extends JpaRepository<CardReview, UUID> {

    Optional<CardReview> findByCardId(UUID cardId);

    List<CardReview> findByCardIdIn(Collection<UUID> cardIds);

    @Query("""
            SELECT r FROM CardReview r
            JOIN r.card c
            WHERE c.deck.id = :deckId
            """)
    List<CardReview> findByDeckId(@Param("deckId") UUID deckId);

    @Query("SELECT MAX(r.lastReviewedAt) FROM CardReview r JOIN r.card c WHERE c.deck.id = :deckId")
    Instant findLastReviewedAt(@Param("deckId") UUID deckId);

    @Query("""
            SELECT MIN(r.dueDate) FROM CardReview r
            JOIN r.card c
            WHERE c.deck.id = :deckId AND r.dueDate > :today
            """)
    Optional<LocalDate> findNextDueAfter(@Param("deckId") UUID deckId, @Param("today") LocalDate today);

    @Modifying
    @Query("""
            UPDATE CardReview r
            SET r.dueDate = :today
            WHERE r.card.deck.user.id = :userId
            """)
    int resetDueDatesForUser(@Param("userId") UUID userId, @Param("today") LocalDate today);
}
