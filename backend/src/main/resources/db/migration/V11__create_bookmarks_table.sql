CREATE TABLE bookmarks
(
    status_id BIGINT      NOT NULL,
    user_id   BIGINT      NOT NULL,
    saved_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (status_id, user_id),
    CONSTRAINT fk_bookmarks_status FOREIGN KEY (status_id) REFERENCES statuses (id) ON DELETE CASCADE,
    CONSTRAINT fk_bookmarks_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);