-- One row per unique binary (dedupe happens here)
CREATE TABLE media_asset
(
    media_id      BIGSERIAL PRIMARY KEY,
    content_hash  VARCHAR(64) UNIQUE NOT NULL, -- SHA-256 hex
    filename_hash VARCHAR(64) UNIQUE NOT NULL, -- SHA-256 hex
    extension     VARCHAR(64)        NOT NULL,
    mime_type     VARCHAR(20)        NOT NULL, -- MIME type
    size_bytes    BIGINT             NOT NULL,
    CONSTRAINT mine_type_check CHECK (mime_type in
                                      ('image/jpeg', 'image/png', 'image/webp', 'video/webm', 'video/mp4', 'image/gif'))
);
