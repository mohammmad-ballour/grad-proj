-- 1) notification type enum
CREATE TYPE notification_type AS ENUM ('FOLLOW','LIKE','REPLY','SHARE','MENTION', 'RESTRICT');

-- 2) notifications table
CREATE TABLE notifications
(
    id           BIGSERIAL PRIMARY KEY,
    recipient_id BIGINT            NOT NULL,
    type         notification_type NOT NULL,
    last_read_at TIMESTAMPTZ DEFAULT NULL,
    status_id    BIGINT            NULL,

    CONSTRAINT fk_recipient FOREIGN KEY (recipient_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_status FOREIGN KEY (status_id) REFERENCES statuses (id) ON DELETE CASCADE,
    CONSTRAINT valid_type CHECK (
        (status_id IS NOT NULL AND type IN ('LIKE', 'REPLY', 'SHARE', 'MENTION'))
            OR (status_id IS NULL AND type in ('FOLLOW', 'RESTRICT'))
        )
);

CREATE INDEX idx_notifications_recipient ON notifications (recipient_id);
CREATE INDEX idx_notifications_recipient_lastreadat ON notifications (recipient_id, last_read_at);

-- 3) notification_actors table
CREATE TABLE notification_actors
(
    notification_id BIGINT NOT NULL,
    actor_id        BIGINT NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (notification_id, actor_id),
    CONSTRAINT fk_notification FOREIGN KEY (notification_id) REFERENCES notifications (id) ON DELETE CASCADE,
    CONSTRAINT fk_actor FOREIGN KEY (actor_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_notification_actors_notification ON notification_actors (notification_id);
CREATE INDEX idx_notification_actors_actor ON notification_actors (actor_id);


--4) Aggregation Function
CREATE OR REPLACE FUNCTION public.aggregate_notifications(
    p_recipient_ids BIGINT[], -- list of recipients
    p_type notification_type,
    p_actor_id BIGINT,
    p_status_id BIGINT DEFAULT NULL
) RETURNS void AS
$$
DECLARE
v_notification_id BIGINT;
    v_existing_id     BIGINT;
    v_actor_count     INTEGER;
    v_time_window     INTERVAL := INTERVAL '24 hours';
    v_recipient_id    BIGINT;
BEGIN
    FOREACH v_recipient_id IN ARRAY p_recipient_ids
        LOOP
            -- Handle MENTION/RESTRICT especially (no grouping)
            IF p_type = 'MENTION' OR p_type = 'RESTRICT' THEN
                INSERT INTO notifications (recipient_id, type, status_id)
                VALUES (v_recipient_id, p_type, p_status_id)
                RETURNING id INTO v_notification_id;

INSERT INTO notification_actors (notification_id, actor_id)
VALUES (v_notification_id, p_actor_id);

CONTINUE;
END IF;

            -- For other types, try to find existing notification to aggregate
            IF p_type = 'FOLLOW' THEN
SELECT id
INTO v_existing_id
FROM notifications
         JOIN LATERAL (
    SELECT MAX(created_at) AS max_created_at
    FROM notification_actors na
    WHERE na.notification_id = id
        ) stats ON TRUE
WHERE recipient_id = v_recipient_id
  AND type = p_type
  AND (
    last_read_at IS NULL
        OR stats.max_created_at >= NOW() - v_time_window
    )
ORDER BY CASE WHEN last_read_at IS NULL THEN 0 ELSE 1 END,
         stats.max_created_at DESC
    LIMIT 1;
ELSE
SELECT id
INTO v_existing_id
FROM notifications
         JOIN LATERAL (
    SELECT MAX(created_at) AS max_created_at
    FROM notification_actors na
    WHERE na.notification_id = id
        ) stats ON TRUE
WHERE recipient_id = v_recipient_id
  AND type = p_type
  AND status_id = p_status_id
  AND (
    last_read_at IS NULL
        OR stats.max_created_at >= NOW() - v_time_window
    )
ORDER BY CASE WHEN last_read_at IS NULL THEN 0 ELSE 1 END,
         stats.max_created_at DESC
    LIMIT 1;
END IF;

            IF FOUND THEN
                -- Check if actor already exists
SELECT COUNT(*)
INTO v_actor_count
FROM notification_actors
WHERE notification_id = v_existing_id
  AND actor_id = p_actor_id;

IF v_actor_count = 0 THEN
                    INSERT INTO notification_actors (notification_id, actor_id)
                    VALUES (v_existing_id, p_actor_id);
END IF;
ELSE
                -- Create new notification
                IF p_type = 'FOLLOW' THEN
                    INSERT INTO notifications (recipient_id, type)
                    VALUES (v_recipient_id, p_type)
                    RETURNING id INTO v_notification_id;
ELSE
                    INSERT INTO notifications (recipient_id, type, status_id)
                    VALUES (v_recipient_id, p_type, p_status_id)
                    RETURNING id INTO v_notification_id;
END IF;

INSERT INTO notification_actors (notification_id, actor_id)
VALUES (v_notification_id, p_actor_id);
END IF;
END LOOP;
END;
$$ LANGUAGE plpgsql;

--5) Fetch Notifications Function
CREATE OR REPLACE FUNCTION public.fetch_notifications_for_recipient(
    p_recipient_id BIGINT,
    p_offset INT DEFAULT 0,
    p_limit INT DEFAULT 50
)
    RETURNS TABLE
            (
                id                         BIGINT,
                type                       TEXT,
                recipient_id               BIGINT,
                status_id                  BIGINT,
                last_updated_at            TIMESTAMPTZ,
                actor_count                INTEGER,
                grouping_state             TEXT,
                actor_names                TEXT[],
                last_actor_profile_picture BYTEA,
                status_content             TEXT
            )
    LANGUAGE sql
    STABLE
AS
$$
WITH stats AS (SELECT notification_id,
                      MAX(created_at) AS max_created_at,
                      COUNT(*)        AS actor_count
               FROM notification_actors
               GROUP BY notification_id),

     recent_actors AS (
         -- take up to 3 most recent actors per notification, aggregate names + last actor pic
         SELECT ra.notification_id,
                ARRAY_AGG(u.display_name ORDER BY ra.created_at DESC)
                FILTER (WHERE ra.row_number <= 3)      AS recent_actor_names,
                (ARRAY_AGG(u.profile_picture ORDER BY ra.created_at DESC)
                 FILTER (WHERE ra.row_number <= 1))[1] AS last_actor_profile_picture
         FROM (SELECT notification_id,
                      actor_id,
                      created_at,
                      ROW_NUMBER() OVER (PARTITION BY notification_id ORDER BY created_at DESC) AS row_number
               FROM notification_actors) ra
                  JOIN users u ON ra.actor_id = u.id
         GROUP BY ra.notification_id),

     all_notifications AS (SELECT n.id,
                                  n.type::text         AS type,
                                  n.recipient_id,
                                  n.status_id,
                                  stats.max_created_at AS last_updated_at,
                                  stats.actor_count,
                                  ra.recent_actor_names,
                                  ra.last_actor_profile_picture,
                                  CASE
                                      WHEN n.last_read_at IS NULL THEN 'UNREAD_YET'
                                      WHEN n.last_read_at < stats.max_created_at THEN 'HAS_NEW_ACTIVITY'
                                      ELSE 'READ'
                                      END              AS grouping_state
                           FROM notifications n
                                    JOIN stats ON stats.notification_id = n.id
                                    LEFT JOIN recent_actors ra ON ra.notification_id = n.id
                           WHERE n.recipient_id = p_recipient_id)

SELECT an.id,
       an.type,
       an.recipient_id,
       an.status_id,
       an.last_updated_at,
       an.actor_count,
       an.grouping_state,
       an.recent_actor_names AS actor_names,
       an.last_actor_profile_picture,
       s.content             AS status_content
FROM all_notifications an
         LEFT JOIN statuses s ON an.status_id = s.id
ORDER BY
    -- numeric ordering by grouping state to preserve priority: UNREAD_YET, HAS_NEW_ACTIVITY, READ
    CASE an.grouping_state
        WHEN 'READ' THEN 1000
        ELSE 0
        END,
    an.last_updated_at DESC
OFFSET p_offset LIMIT p_limit;
$$;