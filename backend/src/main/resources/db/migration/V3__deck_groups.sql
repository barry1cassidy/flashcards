CREATE TABLE deck_groups (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    name VARCHAR(80) NOT NULL,
    color VARCHAR(7) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_deck_groups_user (user_id),
    CONSTRAINT fk_deck_groups_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

ALTER TABLE decks
    ADD COLUMN group_id BIGINT NULL,
    ADD KEY idx_decks_group (group_id),
    ADD CONSTRAINT fk_decks_group FOREIGN KEY (group_id) REFERENCES deck_groups (id) ON DELETE SET NULL;
