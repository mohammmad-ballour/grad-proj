-- Create ENUM types
DO
$$
BEGIN
        -- FRIENDS means x follows y and y follows x
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'privacy_settings') THEN
CREATE TYPE PRIVACY_SETTINGS AS ENUM ('EVERYONE', 'FRIENDS', 'FOLLOWERS', 'NONE');
END IF;
END
$$ LANGUAGE plpgsql;

CREATE TABLE user_preferences
(
    user_id               BIGINT PRIMARY KEY,
    is_protected          BOOLEAN          NOT NULL DEFAULT FALSE,
    who_can_message       PRIVACY_SETTINGS NOT NULL DEFAULT 'EVERYONE',
    who_can_add_to_groups PRIVACY_SETTINGS NOT NULL DEFAULT 'EVERYONE',
    CONSTRAINT fk_user_preferences_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT check_protected_message
        CHECK (NOT (is_protected AND (who_can_message = 'EVERYONE' OR user_preferences.who_can_add_to_groups = 'EVERYONE')))
);