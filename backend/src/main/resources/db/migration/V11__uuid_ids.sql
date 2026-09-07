SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS card_reviews;
DROP TABLE IF EXISTS library_cards;
DROP TABLE IF EXISTS cards;
DROP TABLE IF EXISTS decks;
DROP TABLE IF EXISTS library_decks;
DROP TABLE IF EXISTS library_groups;
DROP TABLE IF EXISTS deck_groups;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
    id CHAR(36) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NULL,
    google_sub VARCHAR(255) NULL,
    display_name VARCHAR(100) NOT NULL,
    theme VARCHAR(16) NOT NULL DEFAULT 'DARK',
    locale VARCHAR(16) NOT NULL DEFAULT 'EN',
    deck_sort VARCHAR(16) NOT NULL DEFAULT 'NEWEST',
    study_order VARCHAR(16) NOT NULL DEFAULT 'POSITION',
    study_scope VARCHAR(16) NOT NULL DEFAULT 'DUE_ONLY',
    restudy_wait VARCHAR(16) NOT NULL DEFAULT 'ONE_DAY',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_email (email),
    UNIQUE KEY uk_users_google_sub (google_sub)
);

CREATE TABLE deck_groups (
    id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    name VARCHAR(80) NOT NULL,
    color VARCHAR(7) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_deck_groups_user (user_id),
    CONSTRAINT fk_deck_groups_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE library_groups (
    id CHAR(36) NOT NULL,
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
    id CHAR(36) NOT NULL,
    group_id CHAR(36) NOT NULL,
    slug VARCHAR(64) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT NULL,
    position INT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_library_decks_group_slug (group_id, slug),
    KEY idx_library_decks_group (group_id),
    CONSTRAINT fk_library_decks_group FOREIGN KEY (group_id) REFERENCES library_groups (id) ON DELETE CASCADE
);

CREATE TABLE decks (
    id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    group_id CHAR(36) NULL,
    library_deck_id CHAR(36) NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT NULL,
    front_language VARCHAR(16) NOT NULL DEFAULT 'en-US',
    back_language VARCHAR(16) NOT NULL DEFAULT 'en-US',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_decks_user (user_id),
    KEY idx_decks_group (group_id),
    UNIQUE KEY uk_decks_user_library (user_id, library_deck_id),
    CONSTRAINT fk_decks_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_decks_group FOREIGN KEY (group_id) REFERENCES deck_groups (id) ON DELETE SET NULL,
    CONSTRAINT fk_decks_library_deck FOREIGN KEY (library_deck_id) REFERENCES library_decks (id) ON DELETE SET NULL
);

CREATE TABLE library_cards (
    id CHAR(36) NOT NULL,
    deck_id CHAR(36) NOT NULL,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    hint TEXT NULL,
    position INT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_library_cards_deck (deck_id),
    CONSTRAINT fk_library_cards_deck FOREIGN KEY (deck_id) REFERENCES library_decks (id) ON DELETE CASCADE
);

CREATE TABLE cards (
    id CHAR(36) NOT NULL,
    deck_id CHAR(36) NOT NULL,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    hint TEXT NULL,
    position INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_cards_deck_position (deck_id, position),
    CONSTRAINT fk_cards_deck FOREIGN KEY (deck_id) REFERENCES decks (id) ON DELETE CASCADE
);

CREATE TABLE card_reviews (
    card_id CHAR(36) NOT NULL,
    repetitions INT NOT NULL DEFAULT 0,
    ease_factor DECIMAL(4, 2) NOT NULL DEFAULT 2.50,
    interval_days INT NOT NULL DEFAULT 0,
    due_date DATE NOT NULL,
    last_reviewed_at TIMESTAMP NULL,
    PRIMARY KEY (card_id),
    KEY idx_reviews_due (due_date),
    CONSTRAINT fk_reviews_card FOREIGN KEY (card_id) REFERENCES cards (id) ON DELETE CASCADE
);
