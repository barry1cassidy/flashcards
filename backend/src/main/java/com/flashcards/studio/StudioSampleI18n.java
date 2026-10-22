package com.flashcards.studio;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "studio_sample_i18n")
public class StudioSampleI18n {

    @EmbeddedId
    private StudioSampleI18nId id = new StudioSampleI18nId();

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @MapsId("sceneId")
    @JoinColumn(name = "scene_id")
    private StudioSampleScene scene;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(name = "your_role", nullable = false, length = 80)
    private String yourRole;

    @Column(name = "their_role", nullable = false, length = 80)
    private String theirRole;
}
