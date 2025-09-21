-- ENUM types
DO
$$
    BEGIN
        IF
            NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_privacy') THEN
            CREATE TYPE STATUS_PRIVACY AS ENUM ('PUBLIC', 'FOLLOWERS', 'PRIVATE');
        END IF;
        IF
            NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_audience') THEN
            CREATE TYPE STATUS_AUDIENCE AS ENUM ('EVERYONE', 'FOLLOWERS', 'ONLY_ME');
        END IF;
        IF
            NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'parent_association') THEN
            CREATE TYPE PARENT_ASSOCIATION AS ENUM ('REPLY', 'SHARE');
        END IF;
    END
$$;


CREATE TABLE IF NOT EXISTS public.statuses
(
    id                 BIGINT
        CONSTRAINT pk_posts PRIMARY KEY,
    content            VARCHAR(1000)       NOT NULL,
    content_tsvector   TSVECTOR,
    user_id            BIGINT             NOT NULL,
    privacy            STATUS_PRIVACY  DEFAULT 'PUBLIC',
    created_at         TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    parent_status_id   BIGINT             NULL,
    parent_association PARENT_ASSOCIATION NULL,
    is_pinned          BOOLEAN         DEFAULT FALSE,
    reply_audience     STATUS_AUDIENCE DEFAULT 'EVERYONE',
    share_audience     STATUS_AUDIENCE DEFAULT 'EVERYONE',
    CONSTRAINT fk_statuses_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_statuses_parent_status FOREIGN KEY (parent_status_id) REFERENCES statuses (id) ON DELETE SET NULL,
    -- Both nulls mean a non-child status
    -- Just parent_status_id is null means a child status referencing a deleted parent status
    -- Just parent_association is null is NOT allowed
    -- Both are NOT null means a child status referencing an existing parent status
    CONSTRAINT check_parent_association CHECK (
        (parent_status_id IS NULL AND parent_association IS NULL)
            OR
        (parent_association IS NOT NULL)
        ),
    -- If privacy = 'PRIVATE' then both audiences must be 'ONLY_ME'.
    -- If privacy = 'FOLLOWERS' then neither audience may be 'EVERYONE'.
    CONSTRAINT check_privacy_and_audiences CHECK (
        (NOT (privacy = 'PRIVATE' AND (share_audience <> 'ONLY_ME' OR reply_audience <> 'ONLY_ME')))
            OR
        (NOT (privacy = 'FOLLOWERS' AND (reply_audience = 'EVERYONE' OR share_audience = 'EVERYONE')))
        )
);

CREATE INDEX idx_statuses_content_tsv ON statuses USING GIN (content_tsvector);

-- Mapping table: which media belong to which status
CREATE TABLE status_media
(
    status_id BIGINT NOT NULL REFERENCES statuses (id) ON DELETE CASCADE,
    media_id  BIGINT NOT NULL REFERENCES media_asset (media_id) ON DELETE CASCADE,
    position  INT    NOT NULL DEFAULT 1, -- ordering in the status
    PRIMARY KEY (status_id, media_id)
);