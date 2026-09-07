package com.flashcards.review;

public enum ReviewRating {
    AGAIN(1),
    HARD(3),
    GOOD(4),
    EASY(5);

    private final int quality;

    ReviewRating(int quality) {
        this.quality = quality;
    }

    public int quality() {
        return quality;
    }
}
