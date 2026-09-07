CREATE TABLE library_groups (
    id BIGINT NOT NULL AUTO_INCREMENT,
    slug VARCHAR(64) NOT NULL,
    name VARCHAR(80) NOT NULL,
    color VARCHAR(7) NOT NULL,
    source_language VARCHAR(16) NOT NULL,
    target_language VARCHAR(16) NOT NULL,
    source_url VARCHAR(500) NOT NULL,
    source_title VARCHAR(200) NOT NULL,
    attribution TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_library_groups_slug (slug)
);

CREATE TABLE library_decks (
    id BIGINT NOT NULL AUTO_INCREMENT,
    group_id BIGINT NOT NULL,
    slug VARCHAR(64) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT NULL,
    position INT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_library_decks_group_slug (group_id, slug),
    KEY idx_library_decks_group (group_id),
    CONSTRAINT fk_library_decks_group FOREIGN KEY (group_id) REFERENCES library_groups (id) ON DELETE CASCADE
);

CREATE TABLE library_cards (
    id BIGINT NOT NULL AUTO_INCREMENT,
    deck_id BIGINT NOT NULL,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    hint TEXT NULL,
    position INT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_library_cards_deck (deck_id),
    CONSTRAINT fk_library_cards_deck FOREIGN KEY (deck_id) REFERENCES library_decks (id) ON DELETE CASCADE
);

ALTER TABLE decks
    ADD COLUMN library_deck_id BIGINT NULL,
    ADD UNIQUE KEY uk_decks_user_library (user_id, library_deck_id),
    ADD CONSTRAINT fk_decks_library_deck FOREIGN KEY (library_deck_id) REFERENCES library_decks (id) ON DELETE SET NULL;
