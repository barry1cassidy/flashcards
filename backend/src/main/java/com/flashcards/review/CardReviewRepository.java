package com.flashcards.review;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
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

    @Query("""
            SELECT COUNT(r) FROM CardReview r
            JOIN r.card c
            WHERE c.deck.id = :deckId AND r.lastRating = :rating
            """)
    int countByDeckIdAndLastRating(@Param("deckId") UUID deckId, @Param("rating") ReviewRating rating);

    @Query("""
            SELECT COUNT(r) FROM CardReview r
            JOIN r.card c
            WHERE c.deck.id IN :deckIds AND r.lastRating = :rating
            """)
    int countByDeckIdInAndLastRating(
            @Param("deckIds") Collection<UUID> deckIds, @Param("rating") ReviewRating rating);

    @Query("""
            SELECT MIN(r.dueDate) FROM CardReview r
            JOIN r.card c
            WHERE c.deck.id IN :deckIds AND r.dueDate > :today
            """)
    Optional<LocalDate> findNextDueAfterIn(
            @Param("deckIds") Collection<UUID> deckIds, @Param("today") LocalDate today);

    @Query("""
            SELECT COUNT(r) FROM CardReview r
            JOIN r.card c
            WHERE c.deck.id = :deckId
              AND r.dueDate > :today
              AND (r.lastReviewedAt IS NULL OR r.lastReviewedAt < :startOfToday)
            """)
    int countWaitingAhead(
            @Param("deckId") UUID deckId,
            @Param("today") LocalDate today,
            @Param("startOfToday") Instant startOfToday);

    @Query("""
            SELECT r FROM CardReview r
            JOIN r.card c
            WHERE c.deck.id = :deckId
              AND r.dueDate > :today
              AND (r.lastReviewedAt IS NULL OR r.lastReviewedAt < :startOfToday)
            ORDER BY r.dueDate ASC, c.position ASC, c.id ASC
            """)
    List<CardReview> findWaitingAhead(
            @Param("deckId") UUID deckId,
            @Param("today") LocalDate today,
            @Param("startOfToday") Instant startOfToday,
            Pageable pageable);

    @Query("""
            SELECT COUNT(r) FROM CardReview r
            JOIN r.card c
            WHERE c.deck.id IN :deckIds
              AND r.dueDate > :today
              AND (r.lastReviewedAt IS NULL OR r.lastReviewedAt < :startOfToday)
            """)
    int countWaitingAheadIn(
            @Param("deckIds") Collection<UUID> deckIds,
            @Param("today") LocalDate today,
            @Param("startOfToday") Instant startOfToday);

    @Query("""
            SELECT r FROM CardReview r
            JOIN r.card c
            WHERE c.deck.id IN :deckIds
              AND r.dueDate > :today
              AND (r.lastReviewedAt IS NULL OR r.lastReviewedAt < :startOfToday)
            ORDER BY r.dueDate ASC, c.position ASC, c.id ASC
            """)
    List<CardReview> findWaitingAheadIn(
            @Param("deckIds") Collection<UUID> deckIds,
            @Param("today") LocalDate today,
            @Param("startOfToday") Instant startOfToday,
            Pageable pageable);

    @Modifying
    @Query("""
            UPDATE CardReview r
            SET r.dueDate = :today
            WHERE r.card.deck.id = :deckId AND r.card.deck.user.id = :userId
            """)
    int resetDueDatesForDeck(
            @Param("userId") UUID userId, @Param("deckId") UUID deckId, @Param("today") LocalDate today);

    @Modifying
    @Query("""
            UPDATE CardReview r
            SET r.dueDate = :today
            WHERE r.card.deck.id IN :deckIds AND r.card.deck.user.id = :userId
            """)
    int resetDueDatesForDecks(
            @Param("userId") UUID userId,
            @Param("deckIds") Collection<UUID> deckIds,
            @Param("today") LocalDate today);
}
