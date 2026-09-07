package com.flashcards.study;

import com.flashcards.review.ReviewRating;

import jakarta.validation.constraints.NotNull;

public record ReviewRequest(@NotNull ReviewRating rating) {
}
