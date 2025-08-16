package com.grad.social.repository.chat;

import com.grad.social.model.chat.MessageDto;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Objects;

import static com.grad.social.model.tables.Messages.MESSAGES;
import static com.grad.social.model.tables.MessageStatus.MESSAGE_STATUS;
import static com.grad.social.model.tables.ChatParticipants.CHAT_PARTICIPANTS;
import static com.grad.social.model.tables.Users.USERS;

@Repository
@RequiredArgsConstructor
public class MessageRepository {

    private final DSLContext dsl;

    public Long saveMessage(MessageDto messageDto) {
        return Objects.requireNonNull(dsl.insertInto(MESSAGES, MESSAGES.CHAT_ID, MESSAGES.SENDER_ID, MESSAGES.CONTENT)
                        .values(messageDto.getChatId(), messageDto.getSenderId(), messageDto.getContent())
                        .returning(MESSAGES.MESSAGE_ID)
                        .fetchOne())
                .getMessageId();
    }

    public void initializeMessageStatusForParticipantsExcludingTheSender(Long messageId, Long chatId, Long senderId) {
        dsl.insertInto(MESSAGE_STATUS, MESSAGE_STATUS.MESSAGE_ID, MESSAGE_STATUS.USER_ID)
                .select(
                        dsl.select(DSL.val(messageId), CHAT_PARTICIPANTS.USER_ID)
                                .from(CHAT_PARTICIPANTS)
                                .where(CHAT_PARTICIPANTS.CHAT_ID.eq(chatId)).and(CHAT_PARTICIPANTS.USER_ID.ne(senderId))
                )
                .execute();
    }

    public void updateReadStatus(Long messageId, Long userId) {
        dsl.update(MESSAGE_STATUS)
                .set(MESSAGE_STATUS.READ_AT, Instant.now())
                .where(MESSAGE_STATUS.MESSAGE_ID.eq(messageId))
                .and(MESSAGE_STATUS.USER_ID.eq(userId))
                .execute();
    }

    public void updateDeliveryStatus(Long messageId, Long userId) {
        dsl.update(MESSAGE_STATUS)
                .set(MESSAGE_STATUS.DELIVERED_AT, Instant.now())
                .where(MESSAGE_STATUS.MESSAGE_ID.eq(messageId))
                .and(MESSAGE_STATUS.USER_ID.eq(userId))
                .execute();
    }

    public boolean isAllDelivered(Long messageId) {
        Integer undeliveredCount = dsl.selectCount()
                .from(MESSAGE_STATUS)
                .where(MESSAGE_STATUS.MESSAGE_ID.eq(messageId))
                .and(MESSAGE_STATUS.DELIVERED_AT.isNotNull())
                .fetchOne(0, int.class);     // Fetch first column (COUNT(*)) as int

        return undeliveredCount != null && undeliveredCount == 0;
    }

    public boolean isAllRead(Long messageId) {
        Integer unreadCount = dsl.selectCount()
                .from(MESSAGE_STATUS)
                .where(MESSAGE_STATUS.MESSAGE_ID.eq(messageId))
                .and(MESSAGE_STATUS.READ_AT.isNotNull())
                .fetchOne(0, int.class);

        return unreadCount != null && unreadCount == 0;
    }

    public Integer getNumberOfUnreadMessagesSinceLastOnline(Long userId, Instant lastOnline) {
        return dsl.selectCount()
                .from(MESSAGE_STATUS)
                .join(MESSAGES).on(MESSAGE_STATUS.MESSAGE_ID.eq(MESSAGES.MESSAGE_ID))
                .join(USERS).on(MESSAGE_STATUS.USER_ID.eq(USERS.ID))
                .where(MESSAGE_STATUS.USER_ID.eq(userId).and(MESSAGE_STATUS.READ_AT.isNull().or(MESSAGES.SENT_AT.greaterThan(lastOnline))))
                .fetchOneInto(Integer.class);
    }

}
