package com.flashcards.user;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(length = 36, columnDefinition = "CHAR(36)")
    private UUID id;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(name = "google_sub", unique = true, length = 255)
    private String googleSub;

    @Column(name = "display_name", nullable = false, length = 100)
    private String displayName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Theme theme = Theme.DARK;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private UserLocale locale = UserLocale.EN;

    @Enumerated(EnumType.STRING)
    @Column(name = "deck_sort", nullable = false, length = 16)
    private DeckSort deckSort = DeckSort.NEWEST;

    @Enumerated(EnumType.STRING)
    @Column(name = "study_order", nullable = false, length = 16)
    private StudyOrder studyOrder = StudyOrder.POSITION;

    @Enumerated(EnumType.STRING)
    @Column(name = "study_scope", nullable = false, length = 16)
    private StudyScope studyScope = StudyScope.DUE_ONLY;

    @Enumerated(EnumType.STRING)
    @Column(name = "restudy_wait", nullable = false, length = 16)
    private RestudyWait restudyWait = RestudyWait.ONE_DAY;

    @Column(name = "pro_licensed", nullable = false)
    private boolean proLicensed;

    @Column(nullable = false)
    private boolean admin;

    @Column(name = "teacher_mode", nullable = false)
    private boolean teacherMode;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (theme == null) {
            theme = Theme.DARK;
        }
        if (locale == null) {
            locale = UserLocale.EN;
        }
        if (deckSort == null) {
            deckSort = DeckSort.NEWEST;
        }
        if (studyOrder == null) {
            studyOrder = StudyOrder.POSITION;
        }
        if (studyScope == null) {
            studyScope = StudyScope.DUE_ONLY;
        }
        if (restudyWait == null) {
            restudyWait = RestudyWait.ONE_DAY;
        }
    }
}
