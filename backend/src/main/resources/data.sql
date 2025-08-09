ALTER SEQUENCE users_id_seq RESTART WITH 1;
DELETE FROM users;

-- users
INSERT INTO public.users (id, email, username, display_name, dob, gender, residence, timezone_id, is_protected,
                          is_verified, account_status, who_can_message, joined_at, profile_picture, profile_cover_photo,
                          profile_bio)
VALUES (1, 'test@gmail.com', 'testusername', 'DISPLAY NAME DEMO', '1990-01-01', 'MALE', 'Köln', 'Europe/Berlin', false,
        false, 'ACTIVE', 'EVERYONE', '2025-08-07', null, null, 'System admin')
ON CONFLICT DO NOTHING;
INSERT INTO public.users (id, email, username, display_name, dob, gender, residence, timezone_id, is_protected,
                          is_verified, account_status, who_can_message, joined_at, profile_picture, profile_cover_photo,
                          profile_bio)
VALUES (2, 'test2@gmail.com', 'testusername2', 'DISPLAY NAME DEMO', '1990-01-01', 'MALE', 'Köln', 'Europe/Berlin',
        false,
        false, 'ACTIVE', 'EVERYONE', '2025-08-07', null, null, 'System admin')
ON CONFLICT DO NOTHING;
INSERT INTO public.users (id, email, username, display_name, dob, gender, residence, timezone_id, is_protected,
                          is_verified, account_status, who_can_message, joined_at, profile_picture, profile_cover_photo,
                          profile_bio)
VALUES (3, 'mshokor2003@gmail.com', 'moh2', 'DISPLAY NAME DEMO', '1990-01-01', 'MALE', 'Köln', 'Europe/Berlin', false,
        false, 'ACTIVE', 'EVERYONE', '2025-08-07', null, null, 'System admin');
INSERT INTO public.users (id, email, username, display_name, dob, gender, residence, timezone_id, is_protected,
                          is_verified, account_status, who_can_message, joined_at, profile_picture, profile_cover_photo,
                          profile_bio)
VALUES (4, 'mshokor2004@gmail.com', 'moh3', 'DISPLAY NAME DEMO', '1990-01-01', 'MALE', 'Köln', 'Europe/Berlin', false,
        false, 'ACTIVE', 'EVERYONE', '2025-08-07', null, null, 'System admin');
INSERT INTO public.users (id, email, username, display_name, dob, gender, residence, timezone_id, is_protected,
                          is_verified, account_status, who_can_message, joined_at, profile_picture, profile_cover_photo,
                          profile_bio)
VALUES (5, 'mshokor2005@gmail.com', 'moh4', 'DISPLAY NAME DEMO', '1990-01-01', 'MALE', 'Köln', 'Europe/Berlin', false,
        false, 'ACTIVE', 'EVERYONE', '2025-08-07', null, null, 'System admin');
INSERT INTO public.users (id, email, username, display_name, dob, gender, residence, timezone_id, is_protected,
                          is_verified, account_status, who_can_message, joined_at, profile_picture, profile_cover_photo,
                          profile_bio)
VALUES (6, 'mshokor2006@gmail.com', 'moh5', 'DISPLAY NAME DEMO', '1990-01-01', 'MALE', 'Köln', 'Europe/Berlin', false,
        false, 'ACTIVE', 'EVERYONE', '2025-08-07', null, null, 'System admin');
INSERT INTO public.users (id, email, username, display_name, dob, gender, residence, timezone_id, is_protected,
                          is_verified, account_status, who_can_message, joined_at, profile_picture, profile_cover_photo,
                          profile_bio)
VALUES (7, 'mshokor2007@gmail.com', 'moh6', 'DISPLAY NAME DEMO', '1990-01-01', 'MALE', 'Köln', 'Europe/Berlin', false,
        false, 'ACTIVE', 'EVERYONE', '2025-08-07', null, null, 'System admin');
INSERT INTO public.users (id, email, username, display_name, dob, gender, residence, timezone_id, is_protected,
                          is_verified, account_status, who_can_message, joined_at, profile_picture, profile_cover_photo,
                          profile_bio)
VALUES (8, 'mshokor2008@gmail.com', 'moh7', 'DISPLAY NAME DEMO', '1990-01-01', 'MALE', 'Köln', 'Europe/Berlin', false,
        false, 'ACTIVE', 'EVERYONE', '2025-08-07', null, null, 'System admin');
INSERT INTO public.users (id, email, username, display_name, dob, gender, residence, timezone_id, is_protected,
                          is_verified, account_status, who_can_message, joined_at, profile_picture, profile_cover_photo,
                          profile_bio)
VALUES (9, 'mshokor2009@gmail.com', 'moh8', 'DISPLAY NAME DEMO', '1990-01-01', 'MALE', 'Köln', 'Europe/Berlin', false,
        false, 'ACTIVE', 'EVERYONE', '2025-08-07', null, null, 'System admin');
INSERT INTO public.users (id, email, username, display_name, dob, gender, residence, timezone_id, is_protected,
                          is_verified, account_status, who_can_message, joined_at, profile_picture, profile_cover_photo,
                          profile_bio)
VALUES (10, 'mshokor2010@gmail.com', 'moh9', 'DISPLAY NAME DEMO', '1990-01-01', 'MALE', 'Köln', 'Europe/Berlin', false,
        false, 'ACTIVE', 'EVERYONE', '2025-08-07', null, null, 'System admin');
INSERT INTO public.users (id, email, username, display_name, dob, gender, residence, timezone_id, is_protected,
                          is_verified, account_status, who_can_message, joined_at, profile_picture, profile_cover_photo,
                          profile_bio)
VALUES (11, 'mshokor2011@gmail.com', 'moh10', 'DISPLAY NAME DEMO', '1990-01-01', 'MALE', 'Köln', 'Europe/Berlin', false,
        false, 'ACTIVE', 'EVERYONE', '2025-08-07', null, null, 'System admin');
INSERT INTO public.users (id, email, username, display_name, dob, gender, residence, timezone_id, is_protected,
                          is_verified, account_status, who_can_message, joined_at, profile_picture, profile_cover_photo,
                          profile_bio)
VALUES (12, 'mshokor2012@gmail.com', 'mohA', 'DISPLAY NAME DEMO', '1990-01-01', 'MALE', 'Köln', 'Europe/Berlin', false,
        false, 'ACTIVE', 'EVERYONE', '2025-08-07', null, null, 'System admin');
INSERT INTO public.users (id, email, username, display_name, dob, gender, residence, timezone_id, is_protected,
                          is_verified, account_status, who_can_message, joined_at, profile_picture, profile_cover_photo,
                          profile_bio)
VALUES (13, 'mshokor2013@gmail.com', 'DSADA', 'DISPLAY NAME DEMO', '1990-01-01', 'MALE', 'Köln', 'Europe/Berlin', false,
        false, 'ACTIVE', 'EVERYONE', '2025-08-07', null, null, 'System admin');
INSERT INTO public.users (id, email, username, display_name, dob, gender, residence, timezone_id, is_protected,
                          is_verified, account_status, who_can_message, joined_at, profile_picture, profile_cover_photo,
                          profile_bio)
VALUES (14, 'mshokor2014@gmail.com', 'FSEDW', 'DISPLAY NAME DEMO', '1990-01-01', 'MALE', 'Köln', 'Europe/Berlin', false,
        false, 'ACTIVE', 'EVERYONE', '2025-08-07', null, null, 'System admin');
INSERT INTO public.users (id, email, username, display_name, dob, gender, residence, timezone_id, is_protected,
                          is_verified, account_status, who_can_message, joined_at, profile_picture, profile_cover_photo,
                          profile_bio)
VALUES (15, 'mshokor2015@gmail.com', 'SAS', 'DISPLAY NAME DEMO', '1990-01-01', 'MALE', 'Köln', 'Europe/Berlin', false,
        false, 'ACTIVE', 'EVERYONE', '2025-08-07', null, null, 'System admin');
INSERT INTO public.users (id, email, username, display_name, dob, gender, residence, timezone_id, is_protected,
                          is_verified, account_status, who_can_message, joined_at, profile_picture, profile_cover_photo,
                          profile_bio)
VALUES (16, 'mshokor2016@gmail.com', 'ADADAW', 'DISPLAY NAME DEMO', '1990-01-01', 'MALE', 'Köln', 'Europe/Berlin',
        false, false, 'ACTIVE', 'EVERYONE', '2025-08-07', null, null, 'System admin');


-- followers
INSERT INTO public.user_followers (followed_user_id, follower_id, followed_at, following_priority)
    VALUES (1, 2, '2025-08-06', 'DEFAULT');

INSERT INTO public.user_followers (followed_user_id, follower_id, followed_at, following_priority)
    VALUES (1, 3, '2025-08-01', 'DEFAULT');

INSERT INTO public.user_followers (followed_user_id, follower_id, followed_at, following_priority)
    VALUES (1, 4, '2025-08-06', 'DEFAULT');

INSERT INTO public.user_followers (followed_user_id, follower_id, followed_at, following_priority)
    VALUES (1, 5, '2025-08-06', 'FAVOURITE');

INSERT INTO public.user_followers (followed_user_id, follower_id, followed_at, following_priority)
    VALUES (1, 6, '2025-08-05', 'DEFAULT');

INSERT INTO public.user_followers (followed_user_id, follower_id, followed_at, following_priority)
    VALUES (1, 7, '2025-08-06', 'DEFAULT');

INSERT INTO public.user_followers (followed_user_id, follower_id, followed_at, following_priority)
    VALUES (1, 8, '2025-08-06', 'DEFAULT');

INSERT INTO public.user_followers (followed_user_id, follower_id, followed_at, following_priority)
    VALUES (1, 10, '2025-08-06', 'FAVOURITE');

INSERT INTO public.user_followers (followed_user_id, follower_id, followed_at, following_priority)
    VALUES (1, 11, '2025-05-06', 'DEFAULT');

INSERT INTO public.user_followers (followed_user_id, follower_id, followed_at, following_priority)
    VALUES (1, 12, '2025-08-06', 'DEFAULT');

INSERT INTO public.user_followers (followed_user_id, follower_id, followed_at, following_priority)
    VALUES (1, 13, '2025-08-06', 'DEFAULT');

INSERT INTO public.user_followers (followed_user_id, follower_id, followed_at, following_priority)
    VALUES (1, 14, '2025-08-02', 'RESTRICTED');

INSERT INTO public.user_followers (followed_user_id, follower_id, followed_at, following_priority)
    VALUES (1, 15, '2025-07-06', 'DEFAULT');

INSERT INTO public.user_followers (followed_user_id, follower_id, followed_at, following_priority)
    VALUES (3, 1, '2025-05-06', 'DEFAULT');

INSERT INTO public.user_followers (followed_user_id, follower_id, followed_at, following_priority)
    VALUES (4, 1, '2025-05-06', 'DEFAULT');

INSERT INTO public.user_followers (followed_user_id, follower_id, followed_at, following_priority)
    VALUES (5, 1, '2025-05-10', 'DEFAULT');

INSERT INTO public.user_followers (followed_user_id, follower_id, followed_at, following_priority)
    VALUES (6, 1, '2025-06-06', 'DEFAULT');

INSERT INTO public.user_followers (followed_user_id, follower_id, followed_at, following_priority)
    VALUES (7, 1, '2025-05-06', 'DEFAULT');

INSERT INTO public.user_followers (followed_user_id, follower_id, followed_at, following_priority)
    VALUES (8, 1, '2025-05-06', 'DEFAULT');

INSERT INTO public.user_followers (followed_user_id, follower_id, followed_at, following_priority)
    VALUES (9, 1, '2025-07-03', 'DEFAULT');

INSERT INTO public.user_followers (followed_user_id, follower_id, followed_at, following_priority)
    VALUES (11, 1, '2024-09-13', 'DEFAULT');

INSERT INTO public.user_followers (followed_user_id, follower_id, followed_at, following_priority)
    VALUES (12, 1, '2025-05-06', 'DEFAULT');

INSERT INTO public.user_followers (followed_user_id, follower_id, followed_at, following_priority)
    VALUES (10, 1, '2025-05-04', 'DEFAULT');

INSERT INTO public.user_followers (followed_user_id, follower_id, followed_at, following_priority)
    VALUES (14, 1, '2025-05-09', 'DEFAULT');

INSERT INTO public.user_followers (followed_user_id, follower_id, followed_at, following_priority)
    VALUES (11, 2, '2024-09-13', 'DEFAULT');

INSERT INTO public.user_followers (followed_user_id, follower_id, followed_at, following_priority)
    VALUES (12, 2, '2025-05-06', 'DEFAULT');

INSERT INTO public.user_followers (followed_user_id, follower_id, followed_at, following_priority)
    VALUES (10, 2, '2025-05-04', 'DEFAULT');

INSERT INTO public.user_followers (followed_user_id, follower_id, followed_at, following_priority)
    VALUES (14, 2, '2025-05-09', 'DEFAULT');

INSERT INTO public.user_followers (followed_user_id, follower_id, followed_at, following_priority)
    VALUES (2, 1, '2025-05-01', 'DEFAULT');

INSERT INTO public.user_followers (followed_user_id, follower_id, followed_at, following_priority)
    VALUES (2, 6, '2025-06-01', 'DEFAULT');

INSERT INTO public.user_followers (followed_user_id, follower_id, followed_at, following_priority)
    VALUES (2, 8, '2025-05-07', 'DEFAULT');

INSERT INTO public.user_followers (followed_user_id, follower_id, followed_at, following_priority)
    VALUES (2, 5, '2025-05-02', 'FAVOURITE');

INSERT INTO public.user_followers (followed_user_id, follower_id, followed_at, following_priority)
    VALUES (2, 4, '2025-05-02', 'DEFAULT');

INSERT INTO public.user_followers (followed_user_id, follower_id, followed_at, following_priority)
    VALUES (2, 7, '2025-05-01', 'DEFAULT');

INSERT INTO public.user_followers (followed_user_id, follower_id, followed_at, following_priority)
    VALUES (5, 2, '2025-05-09', 'DEFAULT');

INSERT INTO public.user_followers (followed_user_id, follower_id, followed_at, following_priority)
    VALUES (9, 2, '2025-05-09', 'DEFAULT');

INSERT INTO public.user_followers (followed_user_id, follower_id, followed_at, following_priority)
    VALUES (16, 2, '2025-05-09', 'DEFAULT');


INSERT INTO public.user_mutes (user_id, muted_user_id, muted_at, muted_until)
VALUES (2, 1, '2025-08-09 09:15:49.513348 +00:00', '2025-08-10 09:15:49.513348 +00:00');

INSERT INTO public.user_blocks(user_id, blocked_user_id, blocked_at)
VALUES (2, 3, '2025-08-09');


