package com.flashcards.library;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "library_groups")
public class LibraryGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(length = 36, columnDefinition = "CHAR(36)")
    private UUID id;

    @Column(nullable = false, unique = true, length = 64)
    private String slug;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(nullable = false, length = 7)
    private String color;

    @Column(name = "source_language", nullable = false, length = 16)
    private String sourceLanguage;

    @Column(name = "target_language", nullable = false, length = 16)
    private String targetLanguage;

    @Column(name = "source_url", nullable = false, length = 500)
    private String sourceUrl;

    @Column(name = "source_title", nullable = false, length = 200)
    private String sourceTitle;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String attribution;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
