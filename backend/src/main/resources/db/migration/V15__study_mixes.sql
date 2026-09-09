CREATE TABLE study_mixes (
    id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    name VARCHAR(80) NOT NULL,
    include_all TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_study_mixes_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE study_mix_sets (
    mix_id CHAR(36) NOT NULL,
    set_id CHAR(36) NOT NULL,
    PRIMARY KEY (mix_id, set_id),
    CONSTRAINT fk_study_mix_sets_mix FOREIGN KEY (mix_id) REFERENCES study_mixes (id) ON DELETE CASCADE,
    CONSTRAINT fk_study_mix_sets_set FOREIGN KEY (set_id) REFERENCES deck_groups (id) ON DELETE CASCADE
);

CREATE TABLE study_mix_decks (
    mix_id CHAR(36) NOT NULL,
    deck_id CHAR(36) NOT NULL,
    PRIMARY KEY (mix_id, deck_id),
    CONSTRAINT fk_study_mix_decks_mix FOREIGN KEY (mix_id) REFERENCES study_mixes (id) ON DELETE CASCADE,
    CONSTRAINT fk_study_mix_decks_deck FOREIGN KEY (deck_id) REFERENCES decks (id) ON DELETE CASCADE
);
