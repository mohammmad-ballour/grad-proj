CREATE TABLE chats
(
    chat_id       BIGSERIAL PRIMARY KEY,
    is_group_chat BOOLEAN     DEFAULT FALSE,
    name          VARCHAR(100), -- Display name for 1-1 (default: recipient's display_name, computed at the fly) or group name
    picture       BYTEA,        -- (default: recipient's profile_picture for 1-1, computed at the fly) and custom for groups
    created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP

);

-- Create ENUM types
DO
$$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'chat_status') THEN
            CREATE TYPE CHAT_STATUS AS ENUM ('NORMAL', 'MUTED', 'DELETED');
        END IF;
    END
$$;

-- for 1-1 chats only, we ensure that a pair of users can only have one non-group chat at the application level
CREATE TABLE chat_participants
(
    chat_id     BIGINT REFERENCES chats (chat_id) ON DELETE CASCADE,
    user_id     BIGINT REFERENCES users (id),
--     role VARCHAR(50) DEFAULT 'member', -- e.g., 'admin', 'member'
    chat_status CHAT_STATUS NOT NULL DEFAULT 'NORMAL',
    is_pinned   BOOLEAN              DEFAULT FALSE,
    PRIMARY KEY (chat_id, user_id)
);
CREATE TABLE messages
(
    message_id BIGSERIAL PRIMARY KEY,
    chat_id    BIGINT REFERENCES chats (chat_id) ON DELETE CASCADE,
    sender_id  BIGINT REFERENCES users (id),
    content    TEXT NOT NULL,
    sent_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE message_status
(
    message_id   BIGINT REFERENCES messages (message_id) ON DELETE CASCADE,
    user_id      BIGINT REFERENCES users (id),
    delivered_at TIMESTAMPTZ DEFAULT NULL,
    read_at      TIMESTAMPTZ DEFAULT NULL,
    PRIMARY KEY (message_id, user_id)
);