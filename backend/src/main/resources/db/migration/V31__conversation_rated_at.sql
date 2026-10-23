ALTER TABLE language_conversations
    ADD COLUMN rated_at DATETIME(6) NULL;

UPDATE language_conversations
    SET rated_at = updated_at;
