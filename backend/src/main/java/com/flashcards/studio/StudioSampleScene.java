package com.flashcards.studio;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "studio_sample_scenes")
public class StudioSampleScene {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(length = 36, columnDefinition = "CHAR(36)")
    private UUID id;

    @Column(nullable = false, length = 32, unique = true)
    private String slug;

    @Column(nullable = false, length = 32)
    private String scenario;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 8)
    private LanguageLevel level;

    @Column(nullable = false)
    private int position;

    @OneToMany(mappedBy = "scene", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @org.hibernate.annotations.BatchSize(size = 32)
    private List<StudioSampleI18n> texts = new ArrayList<>();

    @OneToMany(mappedBy = "scene", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("position ASC")
    @org.hibernate.annotations.BatchSize(size = 32)
    private List<StudioSampleTurn> turns = new ArrayList<>();
}
