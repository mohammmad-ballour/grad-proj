CREATE TABLE IF NOT EXISTS public.content_moderation
(
    status_id     BIGINT
    CONSTRAINT pk_post_content_moderation PRIMARY KEY,
    severity    INT DEFAULT 0 CHECK (severity IN (0, 1, 2, 3, 4)),
    category    VARCHAR(50) NOT NULL,
    description TEXT,
    CONSTRAINT fk_post_content_moderation_posts FOREIGN KEY (status_id) REFERENCES statuses (id) ON DELETE CASCADE
    );