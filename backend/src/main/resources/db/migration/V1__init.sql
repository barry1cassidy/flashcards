CREATE TABLE users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_email (email)
);

CREATE TABLE decks (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_decks_user (user_id),
    CONSTRAINT fk_decks_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE cards (
    id BIGINT NOT NULL AUTO_INCREMENT,
    deck_id BIGINT NOT NULL,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    position INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_cards_deck (deck_id),
    CONSTRAINT fk_cards_deck FOREIGN KEY (deck_id) REFERENCES decks (id) ON DELETE CASCADE
);

CREATE TABLE card_reviews (
    card_id BIGINT NOT NULL,
    repetitions INT NOT NULL DEFAULT 0,
    ease_factor DECIMAL(4, 2) NOT NULL DEFAULT 2.50,
    interval_days INT NOT NULL DEFAULT 0,
    due_date DATE NOT NULL,
    last_reviewed_at TIMESTAMP NULL,
    PRIMARY KEY (card_id),
    KEY idx_reviews_due (due_date),
    CONSTRAINT fk_reviews_card FOREIGN KEY (card_id) REFERENCES cards (id) ON DELETE CASCADE
);
