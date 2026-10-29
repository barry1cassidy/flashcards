ALTER TABLE users
    ADD COLUMN apple_sub VARCHAR(255) NULL,
    ADD UNIQUE KEY uk_users_apple_sub (apple_sub);
