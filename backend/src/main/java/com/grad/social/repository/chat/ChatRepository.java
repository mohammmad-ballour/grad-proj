package com.grad.social.repository.chat;

import com.grad.social.model.chat.ChatDto;
import com.grad.social.model.tables.*;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;

import static com.grad.social.model.tables.ChatParticipants.CHAT_PARTICIPANTS;
import static org.jooq.Records.mapping;
import static org.jooq.impl.DSL.lateral;
import static org.jooq.impl.DSL.row;

@Repository
@RequiredArgsConstructor
public class ChatRepository {

    private final RedisTemplate<String, String> redisTemplate;
    private final DSLContext dsl;
    // Aliases for subqueries
    private final Messages m = Messages.MESSAGES;
    private final MessageStatus ms = MessageStatus.MESSAGE_STATUS;
    private final Chats c = Chats.CHATS;
    private final ChatParticipants cp = ChatParticipants.CHAT_PARTICIPANTS.as("cp");
    private final ChatParticipants cp2 = ChatParticipants.CHAT_PARTICIPANTS.as("cp2");
    private final Users u = Users.USERS;

    public Long createOneToOneChat(Long senderId, Long recipientId) {
        // Fetch recipient's display_name and profile_picture
        var recipient = dsl.select(u.ID, u.DISPLAY_NAME, u.PROFILE_PICTURE)
                .from(u)
                .where(u.ID.eq(recipientId))
                .fetchOne();

        if (recipient == null) {
            throw new IllegalArgumentException("Recipient user not found");
        }

        // Create chat
        Long chatId = dsl.insertInto(c, c.NAME, c.PICTURE, c.IS_GROUP_CHAT)
                .values(recipient.get(u.DISPLAY_NAME), recipient.get(u.PROFILE_PICTURE), false)  // Default to recipient's display_name and profile_picture
                .returning(c.CHAT_ID)
                .fetchOne()
                .getChatId();

        // Add participants
        dsl.insertInto(cp, cp.CHAT_ID, cp.USER_ID)
                .values(chatId, senderId)
                .values(chatId, recipientId)
                .execute();

        return chatId;
    }

    public Long isOneToOneChatAlreadyExists(Long userA, Long userB) {
        return dsl.select(c.CHAT_ID)
                .from(c)
                .join(cp).on(c.CHAT_ID.eq(cp.CHAT_ID))
                .join(cp2).on(c.CHAT_ID.eq(cp2.CHAT_ID))
                .where(c.IS_GROUP_CHAT.isFalse().and(cp.USER_ID.eq(userA).and(cp2.USER_ID.eq(userB)))
                )
                .fetchOneInto(Long.class);
    }

    public Long createGroupChat(Long creatorId, String groupName, byte[] groupPicture, Set<Long> participantIds) {
        // Create group chat
        Long chatId = dsl.insertInto(c)
                .set(c.NAME, groupName)         // custom group name
                .set(c.PICTURE, groupPicture)   // Custom group picture
                .returning(c.CHAT_ID)
                .fetchOne()
                .getChatId();

        // Add creator and participants
        participantIds.add(creatorId); // Include creator

        // Build rows for bulk insert
        var rows = participantIds.stream()
                .map(userId -> row(chatId, userId))
                .toList();
        dsl.insertInto(cp, cp.CHAT_ID, cp.USER_ID)
                .valuesOfRows(rows)
                .execute();

        return chatId;
    }

    public boolean isParticipant(Long chatId, Long userId) {
        return dsl.fetchExists(
                dsl.selectOne()
                        .from(CHAT_PARTICIPANTS)
                        .where(CHAT_PARTICIPANTS.CHAT_ID.eq(chatId))
                        .and(CHAT_PARTICIPANTS.USER_ID.eq(userId))
        );
    }

    public List<ChatDto> getChatListForUserByUserId(Long currentUserId) {
        // LATERAL: last message per chat
        var lm = dsl.select(m.CONTENT, m.SENT_AT)
                .from(m)
                .where(m.CHAT_ID.eq(c.CHAT_ID))
                .orderBy(m.SENT_AT.desc())
                .limit(1)
                .asTable("lm");

        // unread count per chat
        var uc = dsl.select(m.CHAT_ID, DSL.count().as("unread_count"))
                .from(m)
                .join(ms).on(ms.MESSAGE_ID.eq(m.MESSAGE_ID))
                .where(ms.USER_ID.eq(currentUserId).and(ms.READ_AT.isNull()))
                .groupBy(m.CHAT_ID)
                .asTable("uc");

        return dsl.selectDistinct(
                        c.CHAT_ID,
                        DSL.case_()
                                .when(c.IS_GROUP_CHAT.isTrue(), c.NAME)
                                .otherwise(u.DISPLAY_NAME).as("chat_name"),
                        DSL.case_()
                                .when(c.IS_GROUP_CHAT.isTrue(), c.PICTURE)
                                .otherwise(u.PROFILE_PICTURE).as("chat_picture"),
                        lm.field(m.CONTENT).as("last_message"),
                        lm.field(m.SENT_AT).as("last_message_time"),
                        DSL.coalesce(uc.field("unread_count", Long.class), DSL.inline(0L)).as("unread_count"),
                        // MULTISET participants (excluding current user)
                        DSL.multiset(
                                DSL.select(cp.USER_ID)
                                        .from(cp)
                                        .where(cp.CHAT_ID.eq(c.CHAT_ID))
                                        .and(cp.USER_ID.ne(currentUserId))
                        ).as("participants").convertFrom(r ->
                                r.into(Long.class) // map directly into a list of longs
                        )
                )
                .from(c)
                .join(cp).on(c.CHAT_ID.eq(cp.CHAT_ID))
                .join(u).on(u.ID.eq(cp.USER_ID))
                .leftJoin(lateral(lm)).on(DSL.trueCondition())
                .leftJoin(uc).on(uc.field(m.CHAT_ID).eq(c.CHAT_ID))
                .where(cp.USER_ID.ne(currentUserId))
                .orderBy(lm.field(m.SENT_AT).desc().nullsLast())
                .fetch(mapping((chatId, chatName, chatPicture, lastMessage, lastMessageSentAt, unreadCount, participants) -> {
                    ChatDto res = new ChatDto();
                    res.setChatId(chatId);
                    res.setName(chatName);
                    res.setChatPicture(chatPicture);
                    res.setLastMessage(lastMessage);
                    res.setLastMessageTime(lastMessageSentAt);
                    res.setUnreadCount(unreadCount);
                    AtomicInteger onlineUsersCount = new AtomicInteger();
                    participants.forEach(participant -> {
                        boolean userOnline = isUserOnline(participant);
                        if (userOnline) onlineUsersCount.getAndIncrement();
                    });
                    res.setOnlineRecipientsNumber(onlineUsersCount.get());
                    return res;
                }));
    }

    private boolean isUserOnline(Long userId) {
        Long size = redisTemplate.opsForSet().size("user:sessions:" + userId);
        return size != null && size > 0;
    }

}
