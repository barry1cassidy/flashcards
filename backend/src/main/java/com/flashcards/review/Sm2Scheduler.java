package com.flashcards.review;

import java.time.Instant;
import java.time.LocalDate;

import org.springframework.stereotype.Component;

@Component
public class Sm2Scheduler {

    public void apply(CardReview review, ReviewRating rating, LocalDate today) {
        int quality = rating.quality();
        double ease = review.getEaseFactor();
        int repetitions = review.getRepetitions();
        int interval = review.getIntervalDays();

        if (quality < 3) {
            repetitions = 0;
            interval = 1;
        } else {
            if (repetitions == 0) {
                interval = 1;
            } else if (repetitions == 1) {
                interval = 6;
            } else {
                interval = (int) Math.round(interval * ease);
            }
            if (rating == ReviewRating.HARD) {
                interval = Math.max(1, (int) Math.round(interval * 1.2));
            } else if (rating == ReviewRating.EASY) {
                interval = Math.max(1, (int) Math.round(interval * 1.3));
            }
            repetitions += 1;
        }

        ease = ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        if (ease < 1.3) {
            ease = 1.3;
        }

        review.setRepetitions(repetitions);
        review.setEaseFactor(Math.round(ease * 100.0) / 100.0);
        review.setIntervalDays(Math.max(1, interval));
        review.setDueDate(today.plusDays(review.getIntervalDays()));
        review.setLastReviewedAt(Instant.now());
    }
}
