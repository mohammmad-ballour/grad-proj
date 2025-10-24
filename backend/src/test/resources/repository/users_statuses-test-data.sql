TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE posts CASCADE;
TRUNCATE TABLE post_comments CASCADE;

ALTER SEQUENCE post_comments_comment_id_seq RESTART WITH 1;
ALTER SEQUENCE users_id_seq RESTART WITH 1;

-- users
INSERT INTO users (email, username, password, dob, gender, residence, timezone, profile_picture, profile_cover_photo,
                   profile_bio)
VALUES
    ('mohbalor@gmail.com', 'mohbalor', 'secret', '1999-01-01', 'MALE', 'Albany, New York', '-05:00 New York',
     null, null, 'Some bio'),
    ('mshukur@example.org', 'mshukur', 'secret', '2000-07-14', 'MALE', ' Hamburg, New York', '-05:00 New York',
     null, null, 'coffee lover'),
    ('baraa@gmail.com', 'baraa', 'secret', '1988-10-18', 'MALE', 'Buffalo, New York', '-05:00 New York',
     null, null, ''),
    ('sarahhhh@gmail.com', 'sarah', 'secret', '1988-10-18', 'FEMALE', 'Buffalo, New York', '-05:00 New York',
     null, null, 'Tech enthusiast'),
    ('lucy@gmail.com', 'lucy', 'secret', '1988-10-18', 'FEMALE', 'Buffalo, New York', '-05:00 New York',
     null, null, 'Tech lover');

-- followers
INSERT INTO user_followers(user_id, follower_id, followed_at, following_priority)
VALUES
    -- New York
    (1, 2, '2024-02-15 14:32:05+00', 'DEFAULT'),
    (1, 3, '2023-11-09 08:22:39+00', 'FAVOURITE'),
    (1, 4, '2024-03-10 19:17:24+00', 'DEFAULT'),

    (2, 1, '2023-12-13 18:59:36+00', 'FAVOURITE'),
    (2, 3, '2024-03-13 17:23:08+00', 'DEFAULT'),

    (3, 1, '2024-01-04 17:45:19+00', 'DEFAULT'),
    (3, 2, '2024-04-20 20:00:33+00', 'DEFAULT'),

    (4, 1, '2024-03-18 05:58:37+00', 'DEFAULT'),
    (4, 5, '2024-03-18 05:58:37+00', 'DEFAULT'),

    (5, 4, '2024-03-18 05:58:37+00', 'DEFAULT');

-- posts
INSERT INTO posts (id, content, user_id, privacy, created_at, parent_post_id, is_pinned, num_likes,
                   comment_audience, share_audience)
VALUES (1, 'Hello, all', 1, 'PUBLIC', CURRENT_TIMESTAMP - INTERVAL '1 day', NULL, false, 2,
        'EVERYONE', 'EVERYONE'),
       (2, 'Nature photography collection', 1, 'FOLLOWERS', CURRENT_TIMESTAMP - INTERVAL '2 days', NULL, false, 2,
        'FOLLOWERS', 'FOLLOWERS'),
       (3, 'My travel experiences', 1, 'PRIVATE', CURRENT_TIMESTAMP - INTERVAL '3 days', NULL, false, 1,
        'ONLY_ME', 'ONLY_ME'),
       (4, 'Opinion on latest tech news', 1, 'PUBLIC', CURRENT_TIMESTAMP - INTERVAL '4 days', NULL, false, 4,
        'EVERYONE', 'EVERYONE'),
       (5, 'Tech event highlights', 1, 'PUBLIC', CURRENT_TIMESTAMP - INTERVAL '5 days', NULL, false, 2,
        'FOLLOWERS', 'FOLLOWERS'),

       (6, 'Private family moments', 2, 'PUBLIC', CURRENT_TIMESTAMP - INTERVAL '6 days', NULL, false, 1,
        'ONLY_ME', 'ONLY_ME'),
       (7, 'some funny meme', 2, 'PUBLIC', CURRENT_TIMESTAMP - INTERVAL '7 days', NULL, true, 2,
        'EVERYONE', 'EVERYONE'),

       (8, 'nice post from mohbalor', 3, 'PUBLIC', CURRENT_TIMESTAMP - INTERVAL '1 day', 1, false, 2,
        'EVERYONE', 'EVERYONE'),

       (9, 'Spring boot', 4, 'PUBLIC', CURRENT_TIMESTAMP - INTERVAL '3 days', NULL, false, 2,
        'EVERYONE', 'EVERYONE'),
       (10, 'Spring data jdbc', 4, 'PUBLIC', CURRENT_TIMESTAMP - INTERVAL '10 days', NULL, false, 2,
        'EVERYONE', 'FOLLOWERS'),
       (11, 'Spring data jpq', 4, 'PUBLIC', CURRENT_TIMESTAMP - INTERVAL '12 days', NULL, false, 2,
        'EVERYONE', 'FOLLOWERS'),
       (12, 'Virtual threads in java 21', 4, 'PUBLIC', CURRENT_TIMESTAMP - INTERVAL '15 days', NULL, false, 1,
        'EVERYONE', 'EVERYONE'),
       (13, 'Controversial topic analysis', 4, 'FOLLOWERS', CURRENT_TIMESTAMP - INTERVAL '17 days', NULL, false, 2,
        'FOLLOWERS', 'FOLLOWERS'),

       (14, 'Good Luck, Sarah!', 5, 'PUBLIC', CURRENT_TIMESTAMP - INTERVAL '18 days', 10, false, 1,
        'FOLLOWERS', 'ONLY_ME'),
       (15, 'Discussion on science', 5, 'PUBLIC', CURRENT_TIMESTAMP - INTERVAL '20 days', NULL, true, 1, 'EVERYONE',
        'EVERYONE'),
       (16, 'Private moments', 5, 'FOLLOWERS', CURRENT_TIMESTAMP - INTERVAL '22 days', NULL, false, 1,
        'FOLLOWERS', 'FOLLOWERS'),
       (17, 'Private moments (2)', 5, 'FOLLOWERS', CURRENT_TIMESTAMP - INTERVAL '21 days 23 hours', NULL, false, 1,
        'ONLY_ME', 'ONLY_ME');

-- posts activity log
INSERT INTO user_post_activity (user_id, post_id, post_activity)
VALUES (1, 7, 'LIKE'),
       (1, 9, 'LIKE'),
       (1, 10, 'LIKE'),
       (1, 11, 'LIKE'),
       (1, 13, 'LIKE'),

       (2, 1, 'LIKE'),
       (2, 2, 'LIKE'),
       (2, 4, 'LIKE'),
       (2, 5, 'LIKE'),
       (2, 6, 'LIKE'),
       (2, 7, 'LIKE'),

       (3, 1, 'LIKE'),
       (3, 2, 'LIKE'),
       (3, 4, 'LIKE'),
       (3, 5, 'LIKE'),
       (3, 7, 'LIKE'),

       (4, 4, 'LIKE'),
       (4, 14, 'LIKE'),
       (4, 15, 'LIKE'),
       (4, 16, 'LIKE'),

       (5, 4, 'LIKE'),
       (5, 9, 'LIKE'),
       (5, 10, 'LIKE'),
       (5, 11, 'LIKE'),
       (5, 12, 'LIKE'),
       (5, 13, 'LIKE'),
       (5, 17, 'LIKE');

-- comments
INSERT INTO post_comments (post_id, user_id, content, parent_comment_id, num_likes, created_at)
VALUES
    -- mohbalor posts
    (1, 2, 'هلا', NULL, 1, CURRENT_TIMESTAMP - INTERVAL '12 hours'),
    (1, 3, 'يا مرحبا', NULL, 1, CURRENT_TIMESTAMP - INTERVAL '11 hours 58 minutes'),
    (1, 3, 'منور أبو عاطف', 1, 2, CURRENT_TIMESTAMP - INTERVAL '11 hours 57 minutes'),

    (2, 3, 'Inspiring shots.', NULL, 1, CURRENT_TIMESTAMP - INTERVAL '1 day 23 hours'),

    (4, 2, 'I agree with your opinion.', NULL, 1, CURRENT_TIMESTAMP - INTERVAL '3 days'),             -- comment_id= 5
    (4, 4, 'Could you share more details?', NULL, 1, CURRENT_TIMESTAMP - INTERVAL '4 days'),

    (5, 2, 'This quote really resonates.', NULL, 1, CURRENT_TIMESTAMP - INTERVAL '6 hours'),

    -- mshukur posts
    (7, 1, 'hahaha', NULL, 1, CURRENT_TIMESTAMP - INTERVAL '5 days 23 hours'),
    (7, 1, 'i will share it!', NULL, 1, CURRENT_TIMESTAMP - INTERVAL '5 days 22 hours 58 minutes'),
    (7, 2, 'no problem haha', 9, 1, CURRENT_TIMESTAMP - INTERVAL '5 days 22 hours 59 minutes'),       -- comment_id= 10
    (7, 2, 'you all can share the meme', NULL, 3, CURRENT_TIMESTAMP - INTERVAL '5 days 22 hours 59 minutes 42 seconds'),
    (7, 3, 'LOL', NULL, 1, CURRENT_TIMESTAMP - INTERVAL '5 days 23 hours 20 minutes'),

    -- sarah posts
    (9, 5, 'I loved this movie too.', NULL, 0, CURRENT_TIMESTAMP - INTERVAL '12 hours'),
    (13, 5, 'I disagree with your review.', NULL, 1, CURRENT_TIMESTAMP - INTERVAL '16 days 22 hours'),
    (13, 1, 'you got a point!', NULL, 1, CURRENT_TIMESTAMP - INTERVAL '16 days 22 hours 12 minutes'), -- comment_id= 15
    (13, 4, 'Do you have anything to say?', 14, 1, CURRENT_TIMESTAMP - INTERVAL '16 days 21 hours 45 minutes'),
    (13, 5, 'I will call you', 16, 0, CURRENT_TIMESTAMP - INTERVAL '16 days 21 hours 40 minutes'),
    (10, 5, 'JPA is better haha', NULL, 0, CURRENT_TIMESTAMP - INTERVAL '5 days 14 hours'),

    -- lucy posts
    (17, 5, 'stay tuned for part 3', NULL, 2, CURRENT_TIMESTAMP - INTERVAL '21 days 22 hours 54 minutes'),

    -- mohbalor add a comment on his private post
    (3, 1, 'post on Friday', NULL, 0, CURRENT_TIMESTAMP - INTERVAL '2 days'); -- comment_id= 20

-- comments activity log
INSERT INTO user_comment_activity (user_id, comment_id, happened_at, comment_activity)
VALUES
    -- like comments events
    (1, 1, CURRENT_TIMESTAMP - INTERVAL '11 hours', 'LIKE'),
    (1, 2, CURRENT_TIMESTAMP - INTERVAL '11 hours', 'LIKE'),
    (1, 3, CURRENT_TIMESTAMP - INTERVAL '11 hours', 'LIKE'),
    (2, 3, CURRENT_TIMESTAMP - INTERVAL '11 hours 55 minutes', 'LIKE'),
    (1, 4, CURRENT_TIMESTAMP - INTERVAL '1 day 16 hours', 'LIKE'),

    (1, 5, CURRENT_TIMESTAMP - INTERVAL '2 days 22 hours', 'LIKE'),
    (1, 6, CURRENT_TIMESTAMP - INTERVAL '3 days', 'LIKE'),
    (1, 7, CURRENT_TIMESTAMP - INTERVAL '4 days 22 hours', 'LIKE'),

    (2, 8, CURRENT_TIMESTAMP - INTERVAL '5 days 22 hours 59 minutes 2 seconds', 'LIKE'),
    (2, 9, CURRENT_TIMESTAMP - INTERVAL '5 days 22 hours 55 minutes', 'LIKE'),
    (1, 10, CURRENT_TIMESTAMP - INTERVAL '5 days 22 hours 58 minutes', 'LIKE'),
    (1, 11, CURRENT_TIMESTAMP - INTERVAL '5 days 22 hours 58 minutes 18 seconds', 'LIKE'),
    (2, 11, CURRENT_TIMESTAMP - INTERVAL '5 days 22 hours 57 minutes 28 seconds', 'LIKE'),
    (3, 11, CURRENT_TIMESTAMP - INTERVAL '5 days 22 hours 57 minutes 23 seconds', 'LIKE'),
    (2, 12, CURRENT_TIMESTAMP - INTERVAL '5 days 22 hours 59 minutes 55 seconds', 'LIKE'),

    (4, 14, CURRENT_TIMESTAMP - INTERVAL '16 days 21 hours 46 minutes', 'LIKE'),
    (4, 15, CURRENT_TIMESTAMP - INTERVAL '16 days 22 hours', 'LIKE'),
    (5, 16, CURRENT_TIMESTAMP - INTERVAL '16 days 21 hours 44 minutes', 'LIKE'),
    (4, 19, CURRENT_TIMESTAMP - INTERVAL '21 days 22 hours 53 minutes', 'LIKE'),
    (5, 19, CURRENT_TIMESTAMP - INTERVAL '21 days 22 hours 51 minutes', 'LIKE');
