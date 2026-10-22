package com.flashcards.studio;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Embeddable
public class LanguageTurn {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 8)
    private LanguageTurnRole role;

    @Column(nullable = false, length = 80)
    private String speaker;

    @Column(name = "native_text", nullable = false, columnDefinition = "TEXT")
    private String nativeText;

    @Column(name = "target_text", nullable = false, columnDefinition = "TEXT")
    private String targetText;
}
