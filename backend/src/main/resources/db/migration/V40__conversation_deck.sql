ALTER TABLE language_conversations
    ADD COLUMN deck_id CHAR(36) NULL,
    ADD CONSTRAINT fk_language_conversations_deck
        FOREIGN KEY (deck_id) REFERENCES decks (id) ON DELETE SET NULL;
