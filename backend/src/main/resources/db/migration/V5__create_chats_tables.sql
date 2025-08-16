CREATE TABLE chats
(
    chat_id       BIGSERIAL PRIMARY KEY,
    is_group_chat BOOLEAN,
    name          VARCHAR(100), -- Display name for 1-1 (default: recipient's display_name) or group name
    picture       BYTEA         -- (default: recipient's profile_picture for 1-1, custom for groups)
);
CREATE TABLE chat_participants
(
    chat_id   BIGINT REFERENCES chats (chat_id) ON DELETE CASCADE,
    user_id   BIGINT REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
--     role VARCHAR(50) DEFAULT 'member', -- e.g., 'admin', 'member'
    PRIMARY KEY (chat_id, user_id)
);
CREATE TABLE messages
(
    message_id BIGSERIAL PRIMARY KEY,
    chat_id    BIGINT REFERENCES chats (chat_id) ON DELETE CASCADE,
    sender_id  BIGINT REFERENCES users(id) ON DELETE CASCADE,
    content    TEXT NOT NULL,
    sent_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE message_status
(
    message_id   BIGINT REFERENCES messages (message_id) ON DELETE CASCADE,
    user_id      BIGINT REFERENCES users(id) ON DELETE CASCADE,
    delivered_at TIMESTAMPTZ DEFAULT NULL,
    read_at      TIMESTAMPTZ DEFAULT NULL,
    PRIMARY KEY (message_id, user_id)
);