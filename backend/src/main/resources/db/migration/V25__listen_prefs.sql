ALTER TABLE users
    ADD COLUMN listen_pause_seconds INT NOT NULL DEFAULT 4,
    ADD COLUMN listen_side_first VARCHAR(8) NOT NULL DEFAULT 'FRONT',
    ADD COLUMN listen_repeat TINYINT(1) NOT NULL DEFAULT 0,
    ADD COLUMN listen_announce TINYINT(1) NOT NULL DEFAULT 1,
    ADD COLUMN listen_sleep_minutes INT NOT NULL DEFAULT 0;
