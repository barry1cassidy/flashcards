CREATE TABLE agent_daily_usage (
    user_id CHAR(36) NOT NULL,
    usage_date DATE NOT NULL,
    call_count INT NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, usage_date),
    CONSTRAINT fk_agent_daily_usage_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
