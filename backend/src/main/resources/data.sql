ALTER SEQUENCE users_id_seq RESTART WITH 1;
DELETE FROM users;


INSERT INTO users (email, username, display_name, dob, gender, residence, timezone_id, profile_bio)
VALUES ('test@gmail.com',
        'testusername',
        'DISPLAY NAME DEMO',
        '1990-01-01',
        'MALE',
        'Köln',
        'Europe/Berlin',
        'System admin'
       )
ON CONFLICT (email) DO NOTHING;;
