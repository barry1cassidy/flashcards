ALTER TABLE users
    ADD COLUMN agent_included_credits INT NOT NULL DEFAULT 0,
    ADD COLUMN agent_addon_credits INT NOT NULL DEFAULT 0,
    ADD COLUMN agent_credit_period CHAR(7) NULL;

CREATE TABLE agent_credit_ledger (
    id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    amount INT NOT NULL,
    bucket VARCHAR(16) NOT NULL,
    reason VARCHAR(32) NOT NULL,
    provider_ref VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_credit_ledger_user (user_id),
    UNIQUE KEY uk_credit_ledger_ref (reason, provider_ref),
    CONSTRAINT fk_credit_ledger_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
