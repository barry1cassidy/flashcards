package com.flashcards.review;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.flashcards.card.Card;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "card_reviews")
public class CardReview {

    @Id
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "card_id", length = 36, columnDefinition = "CHAR(36)")
    private UUID cardId;

    @OneToOne(optional = false, fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "card_id")
    private Card card;

    @Column(nullable = false)
    private int repetitions;

    @Column(name = "ease_factor", nullable = false, columnDefinition = "decimal(4,2)")
    private double easeFactor = 2.5;

    @Column(name = "interval_days", nullable = false)
    private int intervalDays;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "last_reviewed_at")
    private Instant lastReviewedAt;

    public static CardReview newFor(Card card, LocalDate today) {
        CardReview review = new CardReview();
        review.setCard(card);
        review.setRepetitions(0);
        review.setEaseFactor(2.5);
        review.setIntervalDays(0);
        review.setDueDate(today);
        return review;
    }
}
