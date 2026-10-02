CREATE TABLE content_shares (
    id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    kind VARCHAR(8) NOT NULL,
    deck_id CHAR(36) NULL,
    group_id CHAR(36) NULL,
    code VARCHAR(8) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_content_shares_code (code),
    UNIQUE KEY uk_content_shares_deck (deck_id),
    UNIQUE KEY uk_content_shares_group (group_id),
    CONSTRAINT fk_content_shares_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_content_shares_deck FOREIGN KEY (deck_id) REFERENCES decks (id) ON DELETE CASCADE,
    CONSTRAINT fk_content_shares_group FOREIGN KEY (group_id) REFERENCES deck_groups (id) ON DELETE CASCADE
);

ALTER TABLE decks
    ADD COLUMN source_share_id CHAR(36) NULL;

ALTER TABLE deck_groups
    ADD COLUMN source_share_id CHAR(36) NULL;

CREATE INDEX idx_decks_user_source_share ON decks (user_id, source_share_id);
CREATE INDEX idx_groups_user_source_share ON deck_groups (user_id, source_share_id);
