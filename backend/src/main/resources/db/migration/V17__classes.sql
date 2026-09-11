ALTER TABLE users
    ADD COLUMN teacher_mode TINYINT(1) NOT NULL DEFAULT 0;

ALTER TABLE decks
    ADD COLUMN class_source_deck_id CHAR(36) NULL,
    ADD COLUMN class_synced_at TIMESTAMP NULL;

ALTER TABLE cards
    ADD COLUMN source_card_id CHAR(36) NULL;

CREATE INDEX idx_decks_user_class_source ON decks (user_id, class_source_deck_id);
CREATE INDEX idx_cards_source_card ON cards (source_card_id);

CREATE TABLE classes (
    id CHAR(36) NOT NULL,
    teacher_id CHAR(36) NOT NULL,
    name VARCHAR(120) NOT NULL,
    join_code CHAR(6) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_classes_join_code (join_code),
    KEY idx_classes_teacher (teacher_id),
    CONSTRAINT fk_classes_teacher FOREIGN KEY (teacher_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE class_members (
    id CHAR(36) NOT NULL,
    class_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_class_members (class_id, user_id),
    KEY idx_class_members_user (user_id),
    CONSTRAINT fk_class_members_class FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE CASCADE,
    CONSTRAINT fk_class_members_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE class_decks (
    id CHAR(36) NOT NULL,
    class_id CHAR(36) NOT NULL,
    deck_id CHAR(36) NOT NULL,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_class_decks (class_id, deck_id),
    KEY idx_class_decks_deck (deck_id),
    CONSTRAINT fk_class_decks_class FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE CASCADE,
    CONSTRAINT fk_class_decks_deck FOREIGN KEY (deck_id) REFERENCES decks (id) ON DELETE CASCADE
);
