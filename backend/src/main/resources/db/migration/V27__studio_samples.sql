CREATE TABLE studio_sample_scenes (
    id CHAR(36) NOT NULL,
    slug VARCHAR(32) NOT NULL,
    scenario VARCHAR(32) NOT NULL,
    level VARCHAR(8) NOT NULL,
    position INT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_studio_sample_scenes_slug (slug)
);

CREATE TABLE studio_sample_i18n (
    scene_id CHAR(36) NOT NULL,
    language VARCHAR(16) NOT NULL,
    title VARCHAR(120) NOT NULL,
    your_role VARCHAR(80) NOT NULL,
    their_role VARCHAR(80) NOT NULL,
    PRIMARY KEY (scene_id, language),
    CONSTRAINT fk_studio_sample_i18n_scene FOREIGN KEY (scene_id) REFERENCES studio_sample_scenes (id) ON DELETE CASCADE
);

CREATE TABLE studio_sample_turns (
    id CHAR(36) NOT NULL,
    scene_id CHAR(36) NOT NULL,
    position INT NOT NULL,
    role VARCHAR(8) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_studio_sample_turns_scene_position (scene_id, position),
    CONSTRAINT fk_studio_sample_turns_scene FOREIGN KEY (scene_id) REFERENCES studio_sample_scenes (id) ON DELETE CASCADE
);

CREATE TABLE studio_sample_lines (
    turn_id CHAR(36) NOT NULL,
    language VARCHAR(16) NOT NULL,
    speaker VARCHAR(80) NOT NULL,
    line TEXT NOT NULL,
    PRIMARY KEY (turn_id, language),
    CONSTRAINT fk_studio_sample_lines_turn FOREIGN KEY (turn_id) REFERENCES studio_sample_turns (id) ON DELETE CASCADE
);

ALTER TABLE language_conversations
    ADD COLUMN sample_scene_id CHAR(36) NULL,
    ADD CONSTRAINT fk_language_conversations_sample_scene
        FOREIGN KEY (sample_scene_id) REFERENCES studio_sample_scenes (id) ON DELETE SET NULL,
    ADD UNIQUE KEY uk_language_conversations_sample_copy (user_id, sample_scene_id, native_language, target_language);
