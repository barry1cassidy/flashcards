CREATE TABLE language_studio_pairs (
    id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    native_language VARCHAR(16) NOT NULL,
    target_language VARCHAR(16) NOT NULL,
    level VARCHAR(8) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_studio_pairs_user_langs (user_id, native_language, target_language),
    INDEX idx_studio_pairs_user (user_id, updated_at),
    CONSTRAINT fk_studio_pairs_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

INSERT INTO language_studio_pairs (
    id,
    user_id,
    native_language,
    target_language,
    level,
    created_at,
    updated_at
)
SELECT
    UUID(),
    ranked.user_id,
    ranked.native_language,
    ranked.target_language,
    ranked.level,
    ranked.first_created,
    ranked.updated_at
FROM (
    SELECT
        user_id,
        native_language,
        target_language,
        level,
        updated_at,
        MIN(created_at) OVER (
            PARTITION BY user_id, native_language, target_language
        ) AS first_created,
        ROW_NUMBER() OVER (
            PARTITION BY user_id, native_language, target_language
            ORDER BY updated_at DESC
        ) AS rn
    FROM language_conversations
) ranked
WHERE ranked.rn = 1;

CREATE INDEX idx_language_conversations_pair
    ON language_conversations (user_id, native_language, target_language, updated_at);
