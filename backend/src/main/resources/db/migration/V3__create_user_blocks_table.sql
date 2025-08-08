CREATE TABLE IF NOT EXISTS public.user_blocks
(
    user_id         BIGINT NOT NULL,           -- The user who is blocking
    blocked_user_id BIGINT NOT NULL,           -- The user being blocked
    blocked_at      DATE DEFAULT CURRENT_DATE, -- When the blocking occurred
    CONSTRAINT pk_userblocks PRIMARY KEY (user_id, blocked_user_id),
    CONSTRAINT fk_user_blocking FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_blocked_user FOREIGN KEY (blocked_user_id) REFERENCES users (id) ON DELETE CASCADE
);

