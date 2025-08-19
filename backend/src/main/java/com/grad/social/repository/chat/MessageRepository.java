package com.grad.social.repository.chat;

import com.grad.social.common.messaging.redis.RedisConstants;
import com.grad.social.model.chat.request.CreateMessageRequest;
import com.grad.social.model.chat.response.MessageResponse;
import com.grad.social.model.tables.ChatParticipants;
import com.grad.social.model.tables.MessageStatus;
import com.grad.social.model.tables.Messages;
import com.grad.social.model.tables.Users;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Objects;

@Repository
@RequiredArgsConstructor
public class MessageRepository {

    private final DSLContext dsl;
    private final RedisTemplate<String, String> redisTemplate;

    private final Messages m = Messages.MESSAGES;
    private final MessageStatus ms = MessageStatus.MESSAGE_STATUS;
    private final Users u = Users.USERS;
    private final ChatParticipants cp = ChatParticipants.CHAT_PARTICIPANTS;

    public Long saveMessage(CreateMessageRequest messageRequest, Long chatId, Long senderId) {
        return Objects.requireNonNull(dsl.insertInto(m, m.CHAT_ID, m.SENDER_ID, m.CONTENT)
                        .values(chatId, senderId, messageRequest.content())
                        .returning(m.MESSAGE_ID)
                        .fetchOne())
                .getMessageId();
    }

    public void initializeMessageStatusForParticipantsExcludingTheSender(Long messageId, Long chatId, Long senderId) {
        dsl.insertInto(ms, ms.MESSAGE_ID, ms.USER_ID)
                .select(
                        dsl.select(DSL.val(messageId), cp.USER_ID)
                                .from(cp)
                                .where(cp.CHAT_ID.eq(chatId)).and(cp.USER_ID.ne(senderId))
                )
                .execute();
    }

    public void updateReadStatus(Long messageId, Long userId) {
        dsl.update(ms)
                .set(ms.READ_AT, Instant.now())
                .where(ms.MESSAGE_ID.eq(messageId))
                .and(ms.USER_ID.eq(userId))
                .execute();
    }

    public void updateDeliveryStatus(Long messageId, Long userId) {
        dsl.update(ms)
                .set(ms.DELIVERED_AT, Instant.now())
                .where(ms.MESSAGE_ID.eq(messageId))
                .and(ms.USER_ID.eq(userId))
                .execute();
    }

    public boolean isAllDelivered(Long messageId) {
        Integer undeliveredCount = dsl.selectCount()
                .from(ms)
                .where(ms.MESSAGE_ID.eq(messageId))
                .and(ms.DELIVERED_AT.isNotNull())
                .fetchOne(0, int.class);     // Fetch first column (COUNT(*)) as int

        return undeliveredCount != null && undeliveredCount == 0;
    }

    public boolean isAllRead(Long messageId) {
        Integer unreadCount = dsl.selectCount()
                .from(ms)
                .where(ms.MESSAGE_ID.eq(messageId))
                .and(ms.READ_AT.isNotNull())
                .fetchOne(0, int.class);

        return unreadCount != null && unreadCount == 0;
    }

    public Integer getNumberOfUnreadMessagesSinceLastOnline(Long userId) {
        Instant lastOnline = getLastOnline(userId);
        return dsl.selectCount()
                .from(ms)
                .join(m).on(ms.MESSAGE_ID.eq(m.MESSAGE_ID))
                .join(u).on(ms.USER_ID.eq(u.ID))
                .where(ms.USER_ID.eq(userId).and(ms.READ_AT.isNull()
                                .and(m.SENT_AT.greaterThan(lastOnline))
                        )
                )
                .fetchOneInto(Integer.class);
    }

    private Instant getLastOnline(Long userId) {
        Object lastOnlineObj = this.redisTemplate.opsForHash().get(RedisConstants.USERS_SESSION_META_PREFIX.concat(userId.toString()), RedisConstants.LAST_ONLINE_HASH_KEY);
        if (lastOnlineObj == null) {
            return Instant.MAX;
        }
        return Instant.parse(lastOnlineObj.toString());
    }
}
