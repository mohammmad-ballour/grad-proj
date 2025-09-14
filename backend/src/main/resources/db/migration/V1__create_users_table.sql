-- Create a sequence for user IDs
CREATE SEQUENCE IF NOT EXISTS public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1;

-- Create ENUM types
DO
$$
    BEGIN
        -- FRIENDS means x follows y and y follows x
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'privacy_settings') THEN
            CREATE TYPE PRIVACY_SETTINGS AS ENUM ('EVERYONE', 'FRIENDS', 'FOLLOWERS', 'NONE');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender') THEN
            CREATE TYPE GENDER AS ENUM ('MALE', 'FEMALE', 'PREFER_NOT_TO_SAY');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_status') THEN
            CREATE TYPE ACCOUNT_STATUS AS ENUM ('ACTIVE', 'RESTRICTED', 'DEACTIVATED', 'DELETED');
        END IF;
    END
$$;

-- Create users table
CREATE TABLE IF NOT EXISTS public.users
(
    id                    BIGINT       NOT NULL DEFAULT nextval('public.users_id_seq')
        CONSTRAINT pk_users PRIMARY KEY,
    email                 VARCHAR(255) NOT NULL
        CONSTRAINT uq_users_email UNIQUE,
    username              VARCHAR(50)  NOT NULL
        CONSTRAINT uq_users_username UNIQUE,
    display_name          VARCHAR(255) NOT NULL,
    dob                   DATE         NOT NULL,
    gender                GENDER       NOT NULL,
    residence             VARCHAR(255),
    timezone_id           varchar(80)  NOT NULL,
    is_protected          BOOLEAN               DEFAULT FALSE,
    is_verified           BOOLEAN               DEFAULT FALSE,
    account_status        ACCOUNT_STATUS        DEFAULT 'ACTIVE',
    who_can_message       PRIVACY_SETTINGS      DEFAULT 'EVERYONE',
    who_can_add_to_groups PRIVACY_SETTINGS      DEFAULT 'EVERYONE',
    joined_at             DATE                  DEFAULT CURRENT_DATE,
    profile_picture       BYTEA,
    profile_cover_photo   BYTEA,
    profile_bio           VARCHAR(100),
    CONSTRAINT check_protected_message
        CHECK (NOT (is_protected AND who_can_message = 'EVERYONE'))
);
