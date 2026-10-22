CREATE TABLE language_conversations (
    id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    title VARCHAR(120) NOT NULL,
    scenario VARCHAR(32) NOT NULL,
    custom_prompt VARCHAR(240) NULL,
    level VARCHAR(8) NOT NULL,
    native_language VARCHAR(16) NOT NULL,
    target_language VARCHAR(16) NOT NULL,
    your_role VARCHAR(80) NOT NULL,
    their_role VARCHAR(80) NOT NULL,
    status VARCHAR(16) NOT NULL,
    used_learned TINYINT(1) NOT NULL DEFAULT 0,
    sample TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_language_conversations_user (user_id, updated_at),
    CONSTRAINT fk_language_conversations_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE language_turns (
    conversation_id CHAR(36) NOT NULL,
    position INT NOT NULL,
    role VARCHAR(8) NOT NULL,
    speaker VARCHAR(80) NOT NULL,
    native_text TEXT NOT NULL,
    target_text TEXT NOT NULL,
    PRIMARY KEY (conversation_id, position),
    CONSTRAINT fk_language_turns_conversation FOREIGN KEY (conversation_id) REFERENCES language_conversations (id) ON DELETE CASCADE
);
