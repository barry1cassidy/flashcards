ALTER TABLE users
    ADD COLUMN stripe_customer_id VARCHAR(255) NULL,
    ADD COLUMN pro_expires_at TIMESTAMP NULL;

CREATE UNIQUE INDEX uk_users_stripe_customer ON users (stripe_customer_id);

CREATE TABLE subscriptions (
    id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    provider VARCHAR(16) NOT NULL,
    provider_customer_id VARCHAR(255) NULL,
    provider_subscription_id VARCHAR(255) NOT NULL,
    plan VARCHAR(16) NOT NULL,
    status VARCHAR(16) NOT NULL,
    current_period_end TIMESTAMP NULL,
    cancel_at_period_end TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_subscriptions_provider_id (provider, provider_subscription_id),
    KEY idx_subscriptions_user (user_id),
    CONSTRAINT fk_subscriptions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
