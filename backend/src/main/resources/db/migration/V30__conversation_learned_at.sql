ALTER TABLE language_conversations
    ADD COLUMN learned_at DATETIME(6) NULL;

UPDATE language_conversations
    SET learned_at = updated_at
    WHERE status = 'LEARNED';

CREATE INDEX idx_language_conversations_learned
    ON language_conversations (user_id, status, learned_at);
