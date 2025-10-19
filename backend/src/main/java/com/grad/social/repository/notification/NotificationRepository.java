package com.grad.social.repository.notification;

import com.grad.social.common.AppConstants;
import com.grad.social.common.database.utils.JooqUtils;
import com.grad.social.model.Routines;
import com.grad.social.model.notification.NotificationDto;
import com.grad.social.model.tables.NotificationActors;
import com.grad.social.model.tables.Notifications;
import com.grad.social.model.tables.Users;
import com.grad.social.model.tables.Statuses;
import com.grad.social.model.enums.NotificationType;
import com.grad.social.model.tables.records.FetchNotificationsForRecipientRecord;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.jooq.Result;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.jooq.impl.DSL.*;

@Repository
@RequiredArgsConstructor
public class NotificationRepository {
    private final DSLContext dsl;

    // Aliases
    NotificationActors na = NotificationActors.NOTIFICATION_ACTORS.as("na");
    Notifications n = Notifications.NOTIFICATIONS.as("n");
    Users u = Users.USERS.as("u");
    Statuses s = Statuses.STATUSES.as("status");

    public void saveNotification(Long actorId, Long[] recipientIds, Long statusId, NotificationType notificationType) {
        Routines.aggregateNotifications(
                dsl.configuration(),
                recipientIds,
                notificationType,
                actorId,
                statusId
        );
    }

    public void removeNotification(Long actorId, Long statusOwnerId, Long statusId, NotificationType notificationType) {
        // remove the actor from the notification
        Long notificationId = dsl
                .deleteFrom(na)
                .using(n)
                .where(na.NOTIFICATION_ID.eq(n.ID))
                .and(na.ACTOR_ID.eq(actorId))
                .and(n.TYPE.eq(notificationType))
                .and(n.STATUS_ID.eq(statusId))
                .and(n.RECIPIENT_ID.eq(statusOwnerId))
                .returning(na.NOTIFICATION_ID)
                .fetchOneInto(Long.class);

        // clean dead notifications (no actors)
        if (notificationId != null) {
            dsl.deleteFrom(n)
                    .where(n.ID.eq(notificationId))
                    .andNotExists(
                            selectOne()
                                    .from(na)
                                    .where(na.NOTIFICATION_ID.eq(notificationId))
                    )
                    .execute();
        }
    }

    public int markAllAsRead(List<Long> unreadNotifications) {
        return JooqUtils.update(dsl, n, Map.of(n.LAST_READ_AT, Instant.now()), n.ID.in(unreadNotifications));
    }


    public List<NotificationDto> allNotifications(Long recipientId, int offset) {
        Result<FetchNotificationsForRecipientRecord> rows = Routines.fetchNotificationsForRecipient(
                dsl.configuration(),
                recipientId,
                offset,
                AppConstants.DEFAULT_PAGE_SIZE
        );

        return rows.map(record -> new NotificationDto(
                record.get("id", Long.class),
                record.get("type", String.class),
                record.get("recipient_id", Long.class),
                record.get("status_id", Long.class),
                record.get("last_updated_at", Instant.class),
                record.get("actor_count", Integer.class),
                NotificationDto.GroupingState.valueOf(record.get("grouping_state", String.class)),
                record.get("actor_displaynames", String[].class),
                record.get("last_actor_username", String.class),
                record.get("last_actor_profile_picture", byte[].class),
                record.get("status_content", String.class)
        ));
    }
}
