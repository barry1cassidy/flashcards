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
@Table(name = "studio_sample_lines")
public class StudioSampleLine {

    @EmbeddedId
    private StudioSampleLineId id = new StudioSampleLineId();

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @MapsId("turnId")
    @JoinColumn(name = "turn_id")
    private StudioSampleTurn turn;

    @Column(nullable = false, length = 80)
    private String speaker;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String line;
}
