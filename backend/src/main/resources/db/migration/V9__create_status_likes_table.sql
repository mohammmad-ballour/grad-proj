CREATE TABLE IF NOT EXISTS public.status_likes
(
    status_id           BIGINT NOT NULL,
    user_id           BIGINT NOT NULL,
    created_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_post_likes_post FOREIGN KEY (status_id) REFERENCES statuses (id) ON DELETE CASCADE,
    CONSTRAINT fk_post_likes_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);