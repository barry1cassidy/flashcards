package com.flashcards.review;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDate;

import org.junit.jupiter.api.Test;

import com.flashcards.card.Card;

class Sm2SchedulerTest {

    private final Sm2Scheduler scheduler = new Sm2Scheduler();

    @Test
    void againResetsAndSchedulesTomorrow() {
        CardReview review = CardReview.newFor(new Card(), LocalDate.of(2026, 9, 3));
        review.setRepetitions(4);
        review.setIntervalDays(12);
        scheduler.apply(review, ReviewRating.AGAIN, LocalDate.of(2026, 9, 3));
        assertEquals(0, review.getRepetitions());
        assertEquals(1, review.getIntervalDays());
        assertEquals(LocalDate.of(2026, 9, 4), review.getDueDate());
    }

    @Test
    void firstGoodReviewIsDueTomorrow() {
        CardReview review = CardReview.newFor(new Card(), LocalDate.of(2026, 9, 3));
        scheduler.apply(review, ReviewRating.GOOD, LocalDate.of(2026, 9, 3));
        assertEquals(1, review.getRepetitions());
        assertEquals(1, review.getIntervalDays());
        assertEquals(LocalDate.of(2026, 9, 4), review.getDueDate());
    }

    @Test
    void secondGoodReviewJumpsToSixDays() {
        CardReview review = CardReview.newFor(new Card(), LocalDate.of(2026, 9, 3));
        scheduler.apply(review, ReviewRating.GOOD, LocalDate.of(2026, 9, 3));
        scheduler.apply(review, ReviewRating.GOOD, LocalDate.of(2026, 9, 4));
        assertEquals(2, review.getRepetitions());
        assertEquals(6, review.getIntervalDays());
        assertEquals(LocalDate.of(2026, 9, 10), review.getDueDate());
    }

    @Test
    void easyStretchesInterval() {
        CardReview review = CardReview.newFor(new Card(), LocalDate.of(2026, 9, 3));
        scheduler.apply(review, ReviewRating.GOOD, LocalDate.of(2026, 9, 3));
        scheduler.apply(review, ReviewRating.EASY, LocalDate.of(2026, 9, 4));
        assertTrue(review.getIntervalDays() >= 6);
        assertTrue(review.getEaseFactor() >= 2.5);
    }
}
