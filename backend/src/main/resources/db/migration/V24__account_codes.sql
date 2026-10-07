CREATE TABLE account_codes (
    id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    purpose VARCHAR(32) NOT NULL,
    code_hash VARCHAR(255) NOT NULL,
    payload VARCHAR(255) NULL,
    expires_at DATETIME(6) NOT NULL,
    sent_at DATETIME(6) NOT NULL,
    attempt_count INT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_account_codes_user_purpose (user_id, purpose),
    CONSTRAINT fk_account_codes_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
