-- Create ENUM types
DO
$$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'media_type') THEN
            CREATE TYPE MEDIA_TYPE AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'OTHER');
        END IF;
    END
$$;


-- One row per unique binary (dedupe happens here)
CREATE TABLE media_asset
(
    media_id      BIGSERIAL PRIMARY KEY,
    content_hash  VARCHAR(64) UNIQUE NOT NULL, -- SHA-256 hex
    filename_hash VARCHAR(80) UNIQUE NOT NULL, -- SHA-256 hex (including the extension)
    mime_type     VARCHAR(20)        NOT NULL, -- MIME type
    size_bytes    BIGINT             NOT NULL,
    CONSTRAINT mine_type_check CHECK (mime_type in
                                      ('image/jpg', 'image/jpeg', 'image/png', 'image/webp', 'video/webm', 'video/mp4', 'image/gif'))
);

CREATE INDEX idx_media_asset_hash ON media_asset (content_hash);