DO
$$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'following_priority') THEN
            CREATE TYPE FOLLOWING_PRIORITY AS ENUM ('FAVOURITE', 'DEFAULT', 'RESTRICTED');
        END IF;
    END;
$$;

CREATE TABLE IF NOT EXISTS public.user_followers
(
    followed_user_id   BIGINT NOT NULL, -- References the user being followed
    follower_id        BIGINT NOT NULL, -- References the user who is following
    followed_at        DATE               DEFAULT CURRENT_DATE,
    following_priority FOLLOWING_PRIORITY DEFAULT 'DEFAULT',
    CONSTRAINT pk_userfollowers PRIMARY KEY (followed_user_id, follower_id),
    CONSTRAINT fk_user FOREIGN KEY (followed_user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_follower FOREIGN KEY (follower_id) REFERENCES users (id) ON DELETE CASCADE
);
