ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE chats_chat_id_seq RESTART WITH 1;
ALTER SEQUENCE messages_message_id_seq RESTART WITH 1;
ALTER SEQUENCE media_asset_media_id_seq RESTART WITH 1;

DELETE
FROM media_asset;
DELETE
FROM messages;
DELETE
FROM chats;
DELETE
FROM users;

-- users
INSERT INTO public.users (email, username, display_name, dob, gender, residence, timezone_id, is_protected, is_verified,
                          account_status, who_can_message, joined_at, profile_picture, profile_cover_photo,
                          profile_bio)
VALUES ('test@gmail.com', 'testusername', 'USER 1', '1990-01-01', 'MALE', 'Köln', 'Europe/Berlin', false,
        false, 'ACTIVE', 'EVERYONE', '2025-08-07', null, null, 'System admin'),

       ('test2@gmail.com', 'testusername2', 'USER 2', '1990-01-01', 'MALE', 'Köln', 'Europe/Berlin',
        false,
        false, 'ACTIVE', 'EVERYONE', '2025-08-07', null, null, 'System admin'),

       ('mshokor2003@gmail.com', 'moh2', 'USER 3', '1990-01-01', 'MALE', 'Köln', 'Europe/Berlin', false,
        false, 'ACTIVE', 'EVERYONE', '2025-08-07', null, null, 'System admin'),

       ('mshokor2004@gmail.com', 'moh3', 'USER 4', '1990-01-01', 'MALE', 'Köln', 'Europe/Berlin', false,
        false, 'ACTIVE', 'EVERYONE', '2025-08-07', null, null, 'System admin'),

       ('mshokor2005@gmail.com', 'moh4', 'USER 5', '1990-01-01', 'MALE', 'Köln', 'Europe/Berlin', false,
        false, 'ACTIVE', 'EVERYONE', '2025-08-07', null, null, 'System admin'),

       ('mshokor2006@gmail.com', 'moh5', 'USER 6', '1990-01-01', 'MALE', 'Köln', 'Europe/Berlin', false,
        false, 'ACTIVE', 'EVERYONE', '2025-08-07', null, null, 'System admin'),

       ('mshokor2007@gmail.com', 'moh6', 'USER 7', '1990-01-01', 'MALE', 'Köln', 'Europe/Berlin', false,
        false, 'ACTIVE', 'EVERYONE', '2025-08-07', null, null, 'System admin'),

       ('mshokor2008@gmail.com', 'moh7', 'USER 8', '1990-01-01', 'MALE', 'Köln', 'Europe/Berlin', false,
        true, 'ACTIVE', 'EVERYONE', '2025-08-07', null, null, 'System admin'),

       ('mshokor2009@gmail.com', 'moh8', 'USER 9', '1990-01-01', 'MALE', 'Köln', 'Europe/Berlin', false,
        false, 'ACTIVE', 'EVERYONE', '2025-08-07', null, null, 'System admin'),

       ('mshokor2010@gmail.com', 'moh9', 'USER 10', '1990-01-01', 'MALE', 'Köln', 'Europe/Berlin', false,
        false, 'ACTIVE', 'EVERYONE', '2025-08-07', null, null, 'System admin'),

       ('mshokor2011@gmail.com', 'moh10', 'USER 11', '1990-01-01', 'MALE', 'Köln', 'Europe/Berlin', false,
        false, 'ACTIVE', 'EVERYONE', '2025-08-07', null, null, 'System admin'),

       ('mshokor2012@gmail.com', 'mohA', 'USER 12', '1990-01-01', 'MALE', 'Köln', 'Europe/Berlin', false,
        false, 'ACTIVE', 'EVERYONE', '2025-08-07', null, null, 'System admin'),

       ('mshokor2013@gmail.com', 'DSADA', 'USER 13', '1990-01-01', 'MALE', 'Köln', 'Europe/Berlin', false,
        false, 'ACTIVE', 'EVERYONE', '2025-08-07', null, null, 'System admin'),

       ('mshokor2014@gmail.com', 'FSEDW', 'USER 14', '1990-01-01', 'MALE', 'Köln', 'Europe/Berlin', false,
        false, 'ACTIVE', 'EVERYONE', '2025-08-07', null, null, 'System admin'),

       ('mshokor2015@gmail.com', 'SAS', 'USER 15', '1990-01-01', 'MALE', 'Köln', 'Europe/Berlin', false,
        false, 'ACTIVE', 'EVERYONE', '2025-08-07', null, null, 'System admin'),

       ('mshokor2016@gmail.com', 'ADADAW', 'USER 16', '1990-01-01', 'MALE', 'Köln', 'Europe/Berlin',
        false, false, 'ACTIVE', 'EVERYONE', '2025-08-07', null, null, 'System admin');

-- followers
INSERT INTO public.user_followers (followed_user_id, follower_id, followed_at, following_priority)
VALUES (1, 2, '2025-08-06', 'DEFAULT'),
       (1, 3, '2025-08-01', 'DEFAULT'),
       (1, 4, '2025-08-06', 'DEFAULT'),
       (1, 5, '2025-08-06', 'FAVOURITE'),
       (1, 6, '2025-08-05', 'DEFAULT'),
       (1, 7, '2025-08-06', 'DEFAULT'),
       (1, 8, '2025-08-06', 'DEFAULT'),
       (1, 10, '2025-08-06', 'FAVOURITE'),
       (1, 11, '2025-05-06', 'DEFAULT'),
       (1, 12, '2025-08-06', 'DEFAULT'),
       (1, 13, '2025-08-06', 'DEFAULT'),
       (1, 14, '2025-08-02', 'RESTRICTED'),
       (1, 15, '2025-07-06', 'DEFAULT'),

       (2, 1, '2025-05-01', 'DEFAULT'),
       (2, 6, '2025-06-01', 'DEFAULT'),
       (2, 8, '2025-05-07', 'DEFAULT'),
       (2, 5, '2025-05-02', 'FAVOURITE'),
       (2, 4, '2025-05-02', 'DEFAULT'),
       (2, 7, '2025-05-01', 'DEFAULT'),

       (3, 1, '2025-05-06', 'DEFAULT'),

       (4, 1, '2025-05-06', 'DEFAULT'),

       (5, 1, '2025-05-10', 'DEFAULT'),
       (5, 2, '2025-05-09', 'RESTRICTED'),

       (6, 1, '2025-06-06', 'DEFAULT'),

       (7, 1, '2025-05-06', 'DEFAULT'),

       (8, 1, '2025-05-06', 'DEFAULT'),

       (9, 1, '2025-07-03', 'DEFAULT'),
       (9, 2, '2025-05-09', 'DEFAULT'),

       (10, 1, '2025-05-04', 'DEFAULT'),
       (10, 2, '2025-05-04', 'DEFAULT'),

       (11, 1, '2024-09-13', 'DEFAULT'),
       (11, 2, '2024-09-13', 'DEFAULT'),

       (12, 1, '2025-05-06', 'DEFAULT'),
       (12, 2, '2025-05-06', 'FAVOURITE'),

       (14, 1, '2025-05-09', 'DEFAULT'),
       (14, 2, '2025-05-09', 'DEFAULT'),

       (16, 2, '2025-05-09', 'DEFAULT');


INSERT INTO public.user_mutes (user_id, muted_user_id, muted_at, muted_until)
VALUES (2, 1, '2025-08-09 09:15:49.513348 +00:00', '2025-08-10 09:15:49.513348 +00:00');

INSERT INTO public.user_blocks(user_id, blocked_user_id, blocked_at)
VALUES (2, 3, '2025-08-09');

-- chats
INSERT INTO public.chats(chat_id, is_group_chat, name, created_at)
VALUES (1, true, 'Besties', '''2025-08-09 09:15:49.513348 +00:00'''),

       (2, false, 'User 3', '2025-08-05 22:05:05.513348 +00:00'),

       (3, true, 'Backend Team', '2025-08-05 22:05:05.513348 +00:00');
-- no messages yet

-- chat_participants
INSERT INTO public.chat_participants(chat_id, user_id)
VALUES (1, 1),
       (1, 2),
       (1, 3),
       (1, 4),

       (2, 2),
       (2, 3),

       (3, 2),
       (3, 3);

-- messages
INSERT INTO public.messages(chat_id, parent_message_id, sender_id, content, sent_at)
VALUES (1, null, 1, 'Hello, 2 and 3', '2025-08-09 09:15:49.513348 +00:00'),
       (1, null, 2, 'Hey, both', '2025-08-09 09:16:49.513348 +00:00'),
       (1, 2, 1, 'How are you', '2025-08-09 09:25:05.513348 +00:00'),
       (1, 1, 3, 'Hey folks', '2025-08-09 09:28:05.513348 +00:00'),

       (2, null, 2, 'Hey user 3, Shall we create a group for backend stuff?', '2025-08-05 22:05:05.513348 +00:00'),
       (2, 5, 3, 'Let us go!', '2025-08-05 22:31:00.513348 +00:00');

-- message_status
INSERT INTO public.message_status(message_id, user_id, delivered_at, read_at)
VALUES (1, 2, '2025-08-09 09:16:05.513348 +00:00', '2025-08-09 09:15:49.513348 +00:00'),
       (1, 3, '2025-08-09 09:16:05.513348 +00:00', '2025-08-09 09:16:00.513348 +00:00'),
       (1, 4, null, null),

       (2, 1, '2025-08-09 09:17:05.513348 +00:00', '2025-08-09 09:18:07.513348 +00:00'),
       (2, 3, '2025-08-09 09:17:10.513348 +00:00', '2025-08-09 09:18:50.513348 +00:00'),
       (2, 4, null, null),

       (3, 2, '2025-08-09 09:25:49.513348 +00:00', null),
       (3, 3, '2025-08-09 09:25:48.513348 +00:00', '2025-08-09 09:26:05.513348 +00:00'),
       (3, 4, null, null),

       (4, 1, '2025-08-10 22:05:48.513348 +00:00', '2025-08-10 22:30:05.513348 +00:00'),
       (4, 2, '2025-08-09 09:30:05.513348 +00:00', null),
       (4, 4, null, null),

       (5, 3, '2025-08-05 22:05:48.513348 +00:00', '2025-08-05 22:30:05.513348 +00:00'),

       (6, 2, '2025-08-05 22:31:48.513348 +00:00', '2025-08-05 22:32:15.513348 +00:00');