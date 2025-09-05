ALTER SEQUENCE users_id_seq RESTART WITH 1;
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
                          account_status, joined_at, profile_picture, profile_cover_photo,
                          profile_bio, who_can_message, who_can_add_to_groups)
VALUES ('mohbalor@gmail.com', 'mohbalor', 'Mohammad Ballour', '2002-01-01', 'MALE', 'Gaza', 'Africa/Cairo', false,
        false, 'ACTIVE', '2025-08-07', null, null, 'System admin', 'FOLLOWERS', 'FOLLOWERS'),

       ('mshukur@gmail.com', 'mshukur', 'Mohammad Shukur', '2003-01-01', 'MALE', 'Gaza', 'Asia/Jerusalem',
        false, false, 'ACTIVE', '2025-08-07', null, null, 'System admin', 'EVERYONE', 'EVERYONE'),

       ('baraa@gmail.com', 'baraa', 'Baraa Shaat', '2002-05-01', 'MALE', 'Gaza', 'Asia/Jerusalem', false,
        false, 'ACTIVE', '2025-08-07', null, null, 'System admin', 'NONE', 'NONE'),

       ('sarahhhh@gmail.com', 'sarah', 'Sarah', '1990-01-01', 'MALE', 'Köln', 'Europe/Berlin', false,
        false, 'ACTIVE', '2025-08-07', null, null, 'System admin', 'EVERYONE', 'EVERYONE'),

       ('lucy@gmail.com', 'lucy', 'Lucy 💕', '1990-01-01', 'MALE', 'Köln', 'Europe/Berlin', false,
        false, 'ACTIVE', '2025-08-07', null, null, 'System admin', 'FRIENDS', 'FRIENDS'),


       ('mshokor2006@gmail.com', 'moh6', 'USER 6', '1990-01-01', 'MALE', 'Köln', 'Europe/Berlin', false,
        false, 'ACTIVE', '2025-08-07', null, null, 'System admin', 'EVERYONE', 'EVERYONE'),

       ('mshokor2007@gmail.com', 'moh7', 'USER 7', '1990-01-01', 'MALE', 'Köln', 'Europe/Berlin', false,
        false, 'ACTIVE', '2025-08-07', null, null, 'System admin', 'EVERYONE', 'EVERYONE'),

       ('mshokor2008@gmail.com', 'moh8', 'USER 8', '1990-01-01', 'MALE', 'Köln', 'Europe/Berlin', false,
        true, 'ACTIVE', '2025-08-07', null, null, 'System admin', 'EVERYONE', 'EVERYONE'),

       ('mshokor2009@gmail.com', 'moh9', 'USER 9', '1990-01-01', 'MALE', 'Köln', 'Europe/Berlin', false,
        false, 'ACTIVE', '2025-08-07', null, null, 'System admin', 'EVERYONE', 'EVERYONE'),

       ('mshokor2010@gmail.com', 'moh10', 'USER 10', '1990-01-01', 'MALE', 'Köln', 'Europe/Berlin', false,
        false, 'ACTIVE', '2025-08-07', null, null, 'System admin', 'EVERYONE', 'EVERYONE'),

       ('mshokor2011@gmail.com', 'moh11', 'USER 11', '1990-01-01', 'MALE', 'Köln', 'Europe/Berlin', false,
        false, 'ACTIVE', '2025-08-07', null, null, 'System admin', 'EVERYONE', 'EVERYONE'),

       ('mshokor2012@gmail.com', 'moh12', 'USER 12', '1990-01-01', 'MALE', 'Köln', 'Europe/Berlin', false,
        false, 'ACTIVE', '2025-08-07', null, null, 'System admin', 'EVERYONE', 'EVERYONE'),

       ('mshokor2013@gmail.com', 'moh13', 'USER 13', '1990-01-01', 'MALE', 'Köln', 'Europe/Berlin', false,
        false, 'ACTIVE', '2025-08-07', null, null, 'System admin', 'EVERYONE', 'EVERYONE'),

       ('mshokor2014@gmail.com', 'moh14', 'USER 14', '1990-01-01', 'MALE', 'Köln', 'Europe/Berlin', false,
        false, 'ACTIVE', '2025-08-07', null, null, 'System admin', 'EVERYONE', 'EVERYONE'),

       ('mshokor2015@gmail.com', 'moh15', 'USER 15', '1990-01-01', 'MALE', 'Köln', 'Europe/Berlin', false,
        false, 'ACTIVE', '2025-08-07', null, null, 'System admin', 'EVERYONE', 'EVERYONE'),

       ('mshokor2016@gmail.com', 'moh16', 'USER 16', '1990-01-01', 'MALE', 'Köln', 'Europe/Berlin',
        false, false, 'ACTIVE', '2025-08-07', null, null, 'System admin', 'EVERYONE', 'EVERYONE');

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
       (3, 2, '2025-05-06', 'DEFAULT'),

       (4, 1, '2025-05-06', 'DEFAULT'),
       (4, 5, '2025-05-06', 'DEFAULT'),

       (5, 1, '2025-05-10', 'DEFAULT'),
       (5, 2, '2025-05-09', 'RESTRICTED'),
       (5, 4, '2025-05-09', 'RESTRICTED'),

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

-- mutes
INSERT INTO public.user_mutes (user_id, muted_user_id, muted_at, muted_until)
VALUES (2, 1, '2025-08-09 09:15:49.513348 +00:00', '2025-08-10 09:15:49.513348 +00:00');

-- blocks
INSERT INTO public.user_blocks(user_id, blocked_user_id, blocked_at)
VALUES (2, 3, '2025-08-09');

-- media assets
INSERT INTO public.media_asset (content_hash, filename_hash, extension, mime_type, size_bytes)
VALUES ('content19', 'nature1', 'jpeg', 'image/jpeg', 1024),
       ('content23', 'let-us-go', 'mp4', 'video/mp4', 232448),
       ('content24', 'thanks', 'gif', 'image/gif', 138240);

-- chats
INSERT INTO public.chats(chat_id, is_group_chat, name, created_at)
VALUES (1000, true, 'Besties', '''2025-08-09 09:15:49.513348 +00:00'''),

       (2000, false, '', '2025-08-05 22:05:05.513348 +00:00'),

       -- no messages yet in this chat
       (3000, true, 'Backend Team', '2025-08-05 22:05:05.513348 +00:00'),

       (4000, false, '', '2025-08-05 22:05:07.513348 +00:00');

-- chat_participants
INSERT INTO public.chat_participants(chat_id, user_id, last_deleted_at)
VALUES (1000, 1, null),
       (1000, 2, null),
       (1000, 3, null),
       (1000, 4, null),

       (2000, 2, '2025-08-05 22:10:05.513348 +00:00'),
       (2000, 3, null),

       (3000, 2, null),
       (3000, 3, null),

       (4000, 2, null),
       (4000, 4, null);

-- messages
INSERT INTO public.messages(chat_id, parent_message_id, sender_id, content, message_type, media_id, sent_at)
VALUES (1000, null, 1, 'Hello, 2 and 3', 'TEXT', null, '2025-08-09 09:15:49.513348 +00:00'),
       (1000, null, 2, 'Hey, both', 'TEXT', null, '2025-08-09 09:16:49.513348 +00:00'),
       (1000, 2, 1, 'How are you', 'TEXT', null, '2025-08-09 09:25:05.513348 +00:00'),
       (1000, 1, 3, 'Hey folks', 'IMAGE', 1, '2025-08-09 09:28:05.513348 +00:00'),

       (2000, null, 2, 'Hey baraa, Shall we create a group for backend stuff?', 'TEXT', null,
        '2025-08-05 22:05:05.513348 +00:00'),
       (2000, 5, 2, 'Answer ASAP', 'TEXT', null, '2025-08-05 22:20:05.513348 +00:00'),
       (2000, null, 3, '', 'VIDEO', 2, '2025-08-05 22:31:00.513348 +00:00'),

       (4000, null, 2, 'Call me!', 'TEXT', null, '2025-08-05 22:06:00.513348 +00:00'),    -- id = 8

       (2000, null, 2, 'Did you finish the report?', 'TEXT', null, '2025-08-29 18:56:00.513348 +00:00'),
       (2000, null, 3, '70% done', 'TEXT', null, '2025-08-29 19:06:00.513348 +00:00'),
       (2000, null, 3, 'Till tomorrow', 'TEXT', null, '2025-08-29 19:06:43.513348 +00:00'),
       (2000, null, 2, 'Cool.', 'TEXT', null, '2025-08-29 19:07:00.513348 +00:00'),
       (2000, null, 2, 'Can you send it to me before 10 p.m.', 'TEXT', null, '2025-08-29 19:07:48.513348 +00:00'),
       (2000, null, 3, 'Sure', 'TEXT', null, '2025-08-29 19:10:55.513348 +00:00'),
       (2000, 14, 2, '😊', 'IMAGE', 3, '2025-08-29 19:12:00.513348 +00:00'),               -- id = 15

       (2000, null, 2, 'Good Evening', 'TEXT', null, '2025-08-30 15:01:00.513000 +00:00'),
       (2000, null, 2, 'Is the report ready?', 'TEXT', null, '2025-08-30 15:02:05.227000 +00:00'),
       (2000, 13, 2, '👀👀', 'TEXT', null, '2025-08-30 15:03:12.127000 +00:00'),
       (2000, null, 2, 'Also, are we still meeting later?', 'TEXT', null, '2025-08-30 15:04:55.403000 +00:00'),
       (2000, null, 2, 'I need caffeine and gossip 😂😂😂', 'TEXT', null, '2025-08-30 15:05:55.403803 +00:00'),
       (2000, null, 2, 'Let me know if plans change', 'TEXT', null, '2025-08-30 15:06:55.403000 +00:00'),
       (2000, 10, 2, 'Hope it is 😄', 'TEXT', null, '2025-08-30 15:07:07.199000 +00:00'),
       (2000, null, 2, 'Ping me when you are back online', 'TEXT', null, '2025-08-30 15:08:07.199000 +00:00'),

       (2000, 10, 3, 'Hey, not yet', 'TEXT', null, '2025-08-30 20:19:55.150890 +00:00'),
       (2000, 12, 3, 'Yep, 5:30 at the usual spot', 'TEXT', null, '2025-08-30 20:20:33.150890 +00:00'),

       (2000, 18, 2, 'See you there', 'TEXT', null, '2025-08-30 20:21:48.150890 +00:00'), -- id = 19

       (2000, 13, 3, 'Haha same.', 'TEXT', null, '2025-08-30 20:21:59.150890 +00:00'),
       (2000, null, 3, 'More work details on the coffee', 'TEXT', null, '2025-08-30 20:22:16.150890 +00:00');

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

       (6, 3, '2025-08-05 22:20:48.513348 +00:00', '2025-08-05 22:30:05.513348 +00:00'),

       (7, 2, '2025-08-05 22:31:48.513348 +00:00', '2025-08-05 22:32:15.513348 +00:00'),

       (8, 4, '2025-08-05 22:07:00.513348 +00:00', '2025-08-05 23:55:11.513348 +00:00'),

       (9, 3, '2025-08-29 18:56:10.513348 +00:00', '2025-08-29 18:58:00.513348 +00:00'),
       (10, 2, '2025-08-29 19:06:12.513348 +00:00', '2025-08-29 19:07:30.513348 +00:00'),
       (11, 2, '2025-08-29 19:06:59.513348 +00:00', '2025-08-29 19:07:30.513348 +00:00'),
       (12, 3, '2025-08-29 19:07:58.513348 +00:00', '2025-08-29 19:10:11.513348 +00:00'),
       (13, 3, '2025-08-29 19:07:58.513348 +00:00', '2025-08-29 19:10:11.513348 +00:00'),
       (14, 2, '2025-08-29 19:11:01.513348 +00:00', '2025-08-29 19:11:33.513348 +00:00'),
       (15, 3, '2025-08-29 19:12:16.513348 +00:00', '2025-08-29 19:15:01.513348 +00:00'),

       (16, 3, '2025-08-30 20:15:07.199000 +00:00', '2025-08-30 20:18:33.150890 +00:00'),
       (17, 3, '2025-08-30 20:15:07.199000 +00:00', '2025-08-30 20:18:33.150890 +00:00'),
       (18, 3, '2025-08-30 20:15:07.199000 +00:00', '2025-08-30 20:18:33.150890 +00:00'),
       (19, 3, '2025-08-30 20:15:07.199000 +00:00', '2025-08-30 20:18:33.150890 +00:00'),
       (20, 3, '2025-08-30 20:15:07.199000 +00:00', '2025-08-30 20:18:33.150890 +00:00'),
       (21, 3, '2025-08-30 20:15:07.199000 +00:00', '2025-08-30 20:18:33.150890 +00:00'),
       (22, 3, '2025-08-30 20:15:07.199000 +00:00', '2025-08-30 20:18:33.150890 +00:00'),
       (23, 3, '2025-08-30 20:15:07.199000 +00:00', '2025-08-30 20:18:33.150890 +00:00'),

       (24, 2, '2025-08-30 20:20:07.199000 +00:00', '2025-08-30 20:21:05.199000 +00:00'),
       (25, 2, '2025-08-30 20:20:24.199000 +00:00', '2025-08-30 20:21:05.200890 +00:00'),

       (26, 3, '2025-08-30 20:21:50.150890 +00:00', '2025-08-30 20:21:52.200890 +00:00'),

       (27, 2, '2025-08-30 20:22:00.150890 +00:00', '2025-08-30 20:22:33.200890 +00:00'),
       (28, 2, '2025-08-30 20:22:00.199000 +00:00', '2025-08-30 20:22:33.200890 +00:00');