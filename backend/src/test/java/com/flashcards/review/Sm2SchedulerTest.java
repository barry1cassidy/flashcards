package com.flashcards.review;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDate;

import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import com.flashcards.card.Card;

/**
 * Button labels in the UI: Missed = AGAIN, Hard = HARD, Got it = GOOD, Easy = EASY.
 *
 * Good and Easy are not the same. On a learned card, Easy waits longer this time
 * and raises ease so future waits grow faster. Good keeps the normal SM-2 interval
 * and leaves ease alone.
 */
class Sm2SchedulerTest {

    private static final LocalDate DAY = LocalDate.of(2026, 9, 3);

    private final Sm2Scheduler scheduler = new Sm2Scheduler();

    private CardReview fresh() {
        return CardReview.newFor(new Card(), DAY);
    }

    private CardReview afterFirstGood() {
        CardReview review = fresh();
        scheduler.apply(review, ReviewRating.GOOD, DAY);
        return review;
    }

    private CardReview mature() {
        CardReview review = fresh();
        review.setRepetitions(4);
        review.setIntervalDays(15);
        review.setEaseFactor(2.5);
        return review;
    }

    @Nested
    class Missed {
        @Test
        void newCardIsDueTomorrowAndEaseDrops() {
            CardReview review = fresh();
            scheduler.apply(review, ReviewRating.AGAIN, DAY);
            assertEquals(0, review.getRepetitions());
            assertEquals(1, review.getIntervalDays());
            assertEquals(1.96, review.getEaseFactor());
            assertEquals(DAY.plusDays(1), review.getDueDate());
        }

        @Test
        void matureCardLosesItsStreakAndComesBackTomorrow() {
            CardReview review = mature();
            scheduler.apply(review, ReviewRating.AGAIN, DAY);
            assertEquals(0, review.getRepetitions());
            assertEquals(1, review.getIntervalDays());
            assertEquals(1.96, review.getEaseFactor());
            assertEquals(DAY.plusDays(1), review.getDueDate());
        }

        @Test
        void afterASuccessfulFirstReviewStillResetsToTomorrow() {
            CardReview review = afterFirstGood();
            scheduler.apply(review, ReviewRating.AGAIN, DAY.plusDays(1));
            assertEquals(0, review.getRepetitions());
            assertEquals(1, review.getIntervalDays());
            assertEquals(DAY.plusDays(2), review.getDueDate());
        }

        @Test
        void repeatedMissesFloorEaseAt1_3() {
            CardReview review = fresh();
            scheduler.apply(review, ReviewRating.AGAIN, DAY);
            assertEquals(1.96, review.getEaseFactor());
            scheduler.apply(review, ReviewRating.AGAIN, DAY.plusDays(1));
            assertEquals(1.42, review.getEaseFactor());
            scheduler.apply(review, ReviewRating.AGAIN, DAY.plusDays(2));
            assertEquals(1.3, review.getEaseFactor());
            scheduler.apply(review, ReviewRating.AGAIN, DAY.plusDays(3));
            assertEquals(1.3, review.getEaseFactor());
        }

        @Test
        void afterMissTheNextGotItStartsLearningOver() {
            CardReview review = mature();
            scheduler.apply(review, ReviewRating.AGAIN, DAY);
            scheduler.apply(review, ReviewRating.GOOD, DAY.plusDays(1));
            assertEquals(1, review.getRepetitions());
            assertEquals(1, review.getIntervalDays());
            assertEquals(DAY.plusDays(2), review.getDueDate());
        }
    }

    @Nested
    class Hard {
        @Test
        void newCardIsStillDueTomorrowButEaseDrops() {
            CardReview review = fresh();
            scheduler.apply(review, ReviewRating.HARD, DAY);
            assertEquals(1, review.getRepetitions());
            assertEquals(1, review.getIntervalDays());
            assertEquals(2.36, review.getEaseFactor());
            assertEquals(DAY.plusDays(1), review.getDueDate());
        }

        @Test
        void secondReviewStaysAtOneDayInsteadOfJumpingToSix() {
            CardReview review = afterFirstGood();
            scheduler.apply(review, ReviewRating.HARD, DAY.plusDays(1));
            assertEquals(2, review.getRepetitions());
            assertEquals(1, review.getIntervalDays());
            assertEquals(2.36, review.getEaseFactor());
            assertEquals(DAY.plusDays(2), review.getDueDate());
        }

        @Test
        void matureCardGrowsTheIntervalSlowlyAndLowersEase() {
            CardReview review = mature();
            scheduler.apply(review, ReviewRating.HARD, DAY);
            assertEquals(5, review.getRepetitions());
            assertEquals(18, review.getIntervalDays());
            assertEquals(2.36, review.getEaseFactor());
            assertEquals(DAY.plusDays(18), review.getDueDate());
        }
    }

    @Nested
    class GotIt {
        @Test
        void firstReviewIsDueTomorrowAndEaseStays() {
            CardReview review = fresh();
            scheduler.apply(review, ReviewRating.GOOD, DAY);
            assertEquals(1, review.getRepetitions());
            assertEquals(1, review.getIntervalDays());
            assertEquals(2.5, review.getEaseFactor());
            assertEquals(DAY.plusDays(1), review.getDueDate());
        }

        @Test
        void secondReviewJumpsToSixDays() {
            CardReview review = afterFirstGood();
            scheduler.apply(review, ReviewRating.GOOD, DAY.plusDays(1));
            assertEquals(2, review.getRepetitions());
            assertEquals(6, review.getIntervalDays());
            assertEquals(2.5, review.getEaseFactor());
            assertEquals(DAY.plusDays(7), review.getDueDate());
        }

        @Test
        void thirdReviewMultipliesByEase() {
            CardReview review = afterFirstGood();
            scheduler.apply(review, ReviewRating.GOOD, DAY.plusDays(1));
            scheduler.apply(review, ReviewRating.GOOD, DAY.plusDays(7));
            assertEquals(3, review.getRepetitions());
            assertEquals(15, review.getIntervalDays());
            assertEquals(2.5, review.getEaseFactor());
            assertEquals(DAY.plusDays(22), review.getDueDate());
        }

        @Test
        void matureCardUsesEaseTimesIntervalAndLeavesEaseAlone() {
            CardReview review = mature();
            scheduler.apply(review, ReviewRating.GOOD, DAY);
            assertEquals(5, review.getRepetitions());
            assertEquals(38, review.getIntervalDays());
            assertEquals(2.5, review.getEaseFactor());
            assertEquals(DAY.plusDays(38), review.getDueDate());
        }
    }

    @Nested
    class Easy {
        @Test
        void firstReviewIsStillTomorrowButEaseGoesUp() {
            CardReview review = fresh();
            scheduler.apply(review, ReviewRating.EASY, DAY);
            assertEquals(1, review.getRepetitions());
            assertEquals(1, review.getIntervalDays());
            assertEquals(2.6, review.getEaseFactor());
            assertEquals(DAY.plusDays(1), review.getDueDate());
        }

        @Test
        void secondReviewWaitsEightDaysInsteadOfSix() {
            CardReview review = afterFirstGood();
            scheduler.apply(review, ReviewRating.EASY, DAY.plusDays(1));
            assertEquals(2, review.getRepetitions());
            assertEquals(8, review.getIntervalDays());
            assertEquals(2.6, review.getEaseFactor());
            assertEquals(DAY.plusDays(9), review.getDueDate());
        }

        @Test
        void matureCardWaitsLongerThanGotItAndRaisesEase() {
            CardReview review = mature();
            scheduler.apply(review, ReviewRating.EASY, DAY);
            assertEquals(5, review.getRepetitions());
            assertEquals(49, review.getIntervalDays());
            assertEquals(2.6, review.getEaseFactor());
            assertEquals(DAY.plusDays(49), review.getDueDate());
        }
    }

    @Nested
    class ButtonsComparedOnTheSameCard {
        @Test
        void learningCardMissedHardGotItEasy() {
            CardReview template = afterFirstGood();
            int missed = scheduler.previewIntervalDays(copyOf(template), ReviewRating.AGAIN);
            int hard = scheduler.previewIntervalDays(copyOf(template), ReviewRating.HARD);
            int gotIt = scheduler.previewIntervalDays(copyOf(template), ReviewRating.GOOD);
            int easy = scheduler.previewIntervalDays(copyOf(template), ReviewRating.EASY);
            assertEquals(1, missed);
            assertEquals(1, hard);
            assertEquals(6, gotIt);
            assertEquals(8, easy);
            assertEquals(1, template.getRepetitions());
            assertEquals(1, template.getIntervalDays());
        }

        @Test
        void matureCardMissedHardGotItEasy() {
            CardReview template = mature();
            int missed = scheduler.previewIntervalDays(copyOf(template), ReviewRating.AGAIN);
            int hard = scheduler.previewIntervalDays(copyOf(template), ReviewRating.HARD);
            int gotIt = scheduler.previewIntervalDays(copyOf(template), ReviewRating.GOOD);
            int easy = scheduler.previewIntervalDays(copyOf(template), ReviewRating.EASY);
            assertEquals(1, missed);
            assertEquals(18, hard);
            assertEquals(38, gotIt);
            assertEquals(49, easy);
            assertTrue(missed < hard);
            assertTrue(hard < gotIt);
            assertTrue(gotIt < easy);
        }

        @Test
        void easyRaisesEaseGotItDoesNotHardAndMissedLowerIt() {
            CardReview missed = mature();
            CardReview hard = mature();
            CardReview gotIt = mature();
            CardReview easy = mature();
            scheduler.apply(missed, ReviewRating.AGAIN, DAY);
            scheduler.apply(hard, ReviewRating.HARD, DAY);
            scheduler.apply(gotIt, ReviewRating.GOOD, DAY);
            scheduler.apply(easy, ReviewRating.EASY, DAY);
            assertEquals(1.96, missed.getEaseFactor());
            assertEquals(2.36, hard.getEaseFactor());
            assertEquals(2.5, gotIt.getEaseFactor());
            assertEquals(2.6, easy.getEaseFactor());
        }
    }

    @Nested
    class IntervalSequences {
        @Test
        void fourGotItReviewsGrowOneThenSixThenFifteenThenThirtyEight() {
            CardReview review = fresh();
            rateWhenDue(review, ReviewRating.GOOD);
            assertEquals(1, review.getIntervalDays());
            assertEquals(DAY.plusDays(1), review.getDueDate());

            rateWhenDue(review, ReviewRating.GOOD);
            assertEquals(6, review.getIntervalDays());
            assertEquals(DAY.plusDays(7), review.getDueDate());

            rateWhenDue(review, ReviewRating.GOOD);
            assertEquals(15, review.getIntervalDays());
            assertEquals(DAY.plusDays(22), review.getDueDate());

            rateWhenDue(review, ReviewRating.GOOD);
            assertEquals(38, review.getIntervalDays());
            assertEquals(2.5, review.getEaseFactor());
            assertEquals(DAY.plusDays(60), review.getDueDate());
        }

        @Test
        void threeEasyReviewsGrowFasterThanThreeGotItReviews() {
            CardReview easy = fresh();
            rateWhenDue(easy, ReviewRating.EASY);
            assertEquals(1, easy.getIntervalDays());
            assertEquals(2.6, easy.getEaseFactor());

            rateWhenDue(easy, ReviewRating.EASY);
            assertEquals(8, easy.getIntervalDays());
            assertEquals(2.7, easy.getEaseFactor());
            assertEquals(DAY.plusDays(9), easy.getDueDate());

            rateWhenDue(easy, ReviewRating.EASY);
            assertEquals(29, easy.getIntervalDays());
            assertEquals(2.8, easy.getEaseFactor());
            assertEquals(DAY.plusDays(38), easy.getDueDate());

            CardReview gotIt = fresh();
            rateWhenDue(gotIt, ReviewRating.GOOD);
            rateWhenDue(gotIt, ReviewRating.GOOD);
            rateWhenDue(gotIt, ReviewRating.GOOD);
            assertEquals(15, gotIt.getIntervalDays());
            assertEquals(2.5, gotIt.getEaseFactor());
            assertTrue(easy.getIntervalDays() > gotIt.getIntervalDays());
        }

        @Test
        void hardAfterTwoGotItsGrowsSlowerThanAThirdGotIt() {
            CardReview hardPath = fresh();
            rateWhenDue(hardPath, ReviewRating.GOOD);
            rateWhenDue(hardPath, ReviewRating.GOOD);
            rateWhenDue(hardPath, ReviewRating.HARD);
            assertEquals(7, hardPath.getIntervalDays());
            assertEquals(2.36, hardPath.getEaseFactor());

            CardReview gotItPath = fresh();
            rateWhenDue(gotItPath, ReviewRating.GOOD);
            rateWhenDue(gotItPath, ReviewRating.GOOD);
            rateWhenDue(gotItPath, ReviewRating.GOOD);
            assertEquals(15, gotItPath.getIntervalDays());
            assertTrue(hardPath.getIntervalDays() < gotItPath.getIntervalDays());
        }

        @Test
        void gotItAfterHardUsesTheLowerEase() {
            CardReview review = mature();
            rateWhenDue(review, ReviewRating.HARD);
            assertEquals(18, review.getIntervalDays());
            assertEquals(2.36, review.getEaseFactor());
            rateWhenDue(review, ReviewRating.GOOD);
            assertEquals(42, review.getIntervalDays());
            assertEquals(2.36, review.getEaseFactor());
            assertEquals(DAY.plusDays(60), review.getDueDate());
        }

        @Test
        void newCardAllFourButtonsAreDueTomorrowWithDifferentEase() {
            CardReview missed = fresh();
            CardReview hard = fresh();
            CardReview gotIt = fresh();
            CardReview easy = fresh();
            scheduler.apply(missed, ReviewRating.AGAIN, DAY);
            scheduler.apply(hard, ReviewRating.HARD, DAY);
            scheduler.apply(gotIt, ReviewRating.GOOD, DAY);
            scheduler.apply(easy, ReviewRating.EASY, DAY);
            assertEquals(DAY.plusDays(1), missed.getDueDate());
            assertEquals(DAY.plusDays(1), hard.getDueDate());
            assertEquals(DAY.plusDays(1), gotIt.getDueDate());
            assertEquals(DAY.plusDays(1), easy.getDueDate());
            assertEquals(1, missed.getIntervalDays());
            assertEquals(1, hard.getIntervalDays());
            assertEquals(1, gotIt.getIntervalDays());
            assertEquals(1, easy.getIntervalDays());
            assertEquals(1.96, missed.getEaseFactor());
            assertEquals(2.36, hard.getEaseFactor());
            assertEquals(2.5, gotIt.getEaseFactor());
            assertEquals(2.6, easy.getEaseFactor());
        }
    }

    @Test
    void previewDoesNotMutateTheCard() {
        CardReview review = afterFirstGood();
        scheduler.previewIntervalDays(review, ReviewRating.EASY);
        scheduler.previewIntervalDays(review, ReviewRating.AGAIN);
        assertEquals(1, review.getRepetitions());
        assertEquals(1, review.getIntervalDays());
        assertEquals(2.5, review.getEaseFactor());
    }

    private void rateWhenDue(CardReview review, ReviewRating rating) {
        scheduler.apply(review, rating, review.getDueDate());
    }

    private static CardReview copyOf(CardReview source) {
        CardReview copy = CardReview.newFor(new Card(), DAY);
        copy.setRepetitions(source.getRepetitions());
        copy.setEaseFactor(source.getEaseFactor());
        copy.setIntervalDays(source.getIntervalDays());
        copy.setDueDate(source.getDueDate());
        return copy;
    }
}
