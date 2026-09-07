ALTER TABLE decks
    ADD COLUMN front_language VARCHAR(16) NOT NULL DEFAULT 'en-US',
    ADD COLUMN back_language VARCHAR(16) NOT NULL DEFAULT 'en-US';

UPDATE decks d
INNER JOIN (
    SELECT c.deck_id, c.front_language, c.back_language
    FROM cards c
    INNER JOIN (
        SELECT deck_id, MIN(id) AS min_id
        FROM cards
        GROUP BY deck_id
    ) first_card ON first_card.deck_id = c.deck_id AND first_card.min_id = c.id
) src ON src.deck_id = d.id
SET d.front_language = src.front_language,
    d.back_language = src.back_language;

ALTER TABLE cards
    DROP COLUMN front_language,
    DROP COLUMN back_language;
