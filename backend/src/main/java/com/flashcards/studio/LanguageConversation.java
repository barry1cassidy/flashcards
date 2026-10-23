package com.flashcards.studio;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.flashcards.user.User;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "language_conversations")
public class LanguageConversation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(length = 36, columnDefinition = "CHAR(36)")
    private UUID id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(nullable = false, length = 32)
    private String scenario;

    @Column(name = "custom_prompt", length = 240)
    private String customPrompt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 8)
    private LanguageLevel level;

    @Column(name = "native_language", nullable = false, length = 16)
    private String nativeLanguage;

    @Column(name = "target_language", nullable = false, length = 16)
    private String targetLanguage;

    @Column(name = "your_role", nullable = false, length = 80)
    private String yourRole;

    @Column(name = "their_role", nullable = false, length = 80)
    private String theirRole;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private LanguageSceneStatus status = LanguageSceneStatus.LEARNING;

    @Column(name = "used_learned", nullable = false)
    private boolean usedLearned;

    @Column(nullable = false)
    private boolean sample;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sample_scene_id")
    private StudioSampleScene sampleScene;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "language_turns", joinColumns = @JoinColumn(name = "conversation_id"))
    @OrderColumn(name = "position")
    private List<LanguageTurn> turns = new ArrayList<>();

    @Column(name = "learned_at")
    private Instant learnedAt;

    @Column(name = "rated_at")
    private Instant ratedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
