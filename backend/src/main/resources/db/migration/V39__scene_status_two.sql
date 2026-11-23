UPDATE language_conversations
SET status = 'LEARNING',
    learned_at = NULL
WHERE status IN ('GETTING', 'READY');
