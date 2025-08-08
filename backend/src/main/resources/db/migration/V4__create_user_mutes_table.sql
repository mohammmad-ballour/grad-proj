CREATE TABLE IF NOT EXISTS public.user_mutes
(
    user_id       BIGINT NOT NULL,                       -- The user who is muting
    muted_user_id BIGINT NOT NULL,                       -- The user being muted
    muted_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, -- When the muting occurred
    muted_until   TIMESTAMPTZ,                           -- Until when the muting continues
    CONSTRAINT pk_usermutes PRIMARY KEY (user_id, muted_user_id),
    CONSTRAINT fk_user_muting FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_muted_user FOREIGN KEY (muted_user_id) REFERENCES users (id) ON DELETE CASCADE
);
