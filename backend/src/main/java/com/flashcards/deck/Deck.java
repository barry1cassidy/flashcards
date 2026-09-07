package com.flashcards.deck;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.flashcards.card.CardLanguages;
import com.flashcards.group.DeckGroup;
import com.flashcards.user.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "decks")
public class Deck {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(length = 36, columnDefinition = "CHAR(36)")
    private UUID id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id")
    private DeckGroup group;

    @Column(name = "front_language", nullable = false, length = 16)
    private String frontLanguage = CardLanguages.DEFAULT;

    @Column(name = "back_language", nullable = false, length = 16)
    private String backLanguage = CardLanguages.DEFAULT;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "library_deck_id", length = 36, columnDefinition = "CHAR(36)")
    private UUID libraryDeckId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (updatedAt == null) {
            updatedAt = createdAt;
        }
        if (frontLanguage == null) {
            frontLanguage = CardLanguages.DEFAULT;
        }
        if (backLanguage == null) {
            backLanguage = CardLanguages.DEFAULT;
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
