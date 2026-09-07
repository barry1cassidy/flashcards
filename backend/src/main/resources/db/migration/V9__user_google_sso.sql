ALTER TABLE users
    MODIFY password_hash VARCHAR(255) NULL,
    ADD COLUMN google_sub VARCHAR(255) NULL,
    ADD UNIQUE KEY uk_users_google_sub (google_sub);
