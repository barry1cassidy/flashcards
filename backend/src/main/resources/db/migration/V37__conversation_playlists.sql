CREATE TABLE conversation_playlists (
    id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    name VARCHAR(80) NOT NULL,
    native_language VARCHAR(16) NOT NULL,
    target_language VARCHAR(16) NOT NULL,
    include_all TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_conversation_playlists_user (user_id, updated_at),
    INDEX idx_conversation_playlists_pair (user_id, native_language, target_language),
    CONSTRAINT fk_conversation_playlists_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE conversation_playlist_items (
    id CHAR(36) NOT NULL,
    playlist_id CHAR(36) NOT NULL,
    conversation_id CHAR(36) NOT NULL,
    position INT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_playlist_conversation (playlist_id, conversation_id),
    INDEX idx_playlist_items_position (playlist_id, position),
    CONSTRAINT fk_playlist_items_playlist FOREIGN KEY (playlist_id) REFERENCES conversation_playlists (id) ON DELETE CASCADE,
    CONSTRAINT fk_playlist_items_conversation FOREIGN KEY (conversation_id) REFERENCES language_conversations (id) ON DELETE CASCADE
);
