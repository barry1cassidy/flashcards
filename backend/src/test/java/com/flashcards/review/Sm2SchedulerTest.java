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
    void previewMatchesApplyWithoutMutating() {
        CardReview review = CardReview.newFor(new Card(), LocalDate.of(2026, 9, 3));
        review.setRepetitions(1);
        review.setIntervalDays(1);
        int goodDays = scheduler.previewIntervalDays(review, ReviewRating.GOOD);
        int hardDays = scheduler.previewIntervalDays(review, ReviewRating.HARD);
        int easyDays = scheduler.previewIntervalDays(review, ReviewRating.EASY);
        assertEquals(1, hardDays);
        assertEquals(6, goodDays);
        assertEquals(8, easyDays);
        assertEquals(1, review.getRepetitions());
        assertEquals(1, review.getIntervalDays());
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

    @Test
    void hardIsShorterThanGoodOnAMatureCard() {
        CardReview review = CardReview.newFor(new Card(), LocalDate.of(2026, 9, 3));
        review.setRepetitions(4);
        review.setIntervalDays(15);
        review.setEaseFactor(2.5);
        int hardDays = scheduler.previewIntervalDays(review, ReviewRating.HARD);
        int goodDays = scheduler.previewIntervalDays(review, ReviewRating.GOOD);
        int easyDays = scheduler.previewIntervalDays(review, ReviewRating.EASY);
        assertEquals(18, hardDays);
        assertEquals(38, goodDays);
        assertEquals(49, easyDays);
    }
}
