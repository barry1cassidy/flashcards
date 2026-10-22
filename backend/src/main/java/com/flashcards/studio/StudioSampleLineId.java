package com.flashcards.studio;

import java.io.Serializable;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@EqualsAndHashCode
@Embeddable
public class StudioSampleLineId implements Serializable {

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "turn_id", length = 36, columnDefinition = "CHAR(36)")
    private UUID turnId;

    @Column(length = 16)
    private String language;
}
