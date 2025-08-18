package com.grad.social.repository.chat;

import com.grad.social.model.chat.ChatDto;
import com.grad.social.model.tables.*;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.jooq.Field;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Set;

import static com.grad.social.model.tables.ChatParticipants.CHAT_PARTICIPANTS;
import static org.jooq.impl.DSL.row;

@Repository
@RequiredArgsConstructor
public class ChatRepository {

    private final DSLContext dsl;
    // Aliases for subqueries
    private final Messages m = Messages.MESSAGES;
    private final MessageStatus ms = MessageStatus.MESSAGE_STATUS;
    private final Chats c = Chats.CHATS;
    private final ChatParticipants cp = ChatParticipants.CHAT_PARTICIPANTS;
    private final Users u = Users.USERS;

    public Long createOneOnOneChat(Long senderId, Long recipientId) {
        // Fetch recipient's display_name and profile_picture
        var recipient = dsl.select(u.ID, u.DISPLAY_NAME, u.PROFILE_PICTURE)
                .from(u)
                .where(u.ID.eq(recipientId))
                .fetchOne();

        if (recipient == null) {
            throw new IllegalArgumentException("Recipient user not found");
        }
        Field<String> field = recipient.field(u.DISPLAY_NAME);
        System.out.println(field);

        // Create chat
        Long chatId = dsl.insertInto(c, c.NAME, c.PICTURE)
                .values(recipient.get(u.DISPLAY_NAME), recipient.get(u.PROFILE_PICTURE))  // Default to recipient's display_name and profile_picture
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

    public List<ChatDto> getChatListForUserByUserId(Long userId) {
        var userAvatarSubquery = dsl.select(u.DISPLAY_NAME, u.PROFILE_PICTURE)
                .from(u)
                .where(u.ID.eq(userId))
                .asTable("avatar_user");

        // Subquery for the most recent message (LATERAL)
        var lastMessageSubquery = dsl.select(m.MESSAGE_ID, m.CONTENT, m.SENT_AT)
                .from(m)
                .join(c).on(m.CHAT_ID.eq(c.CHAT_ID))
                .orderBy(m.SENT_AT.desc())
                .limit(1)
                .asTable("last_message");

        // Subquery for unread message count
        var unreadSubquery = dsl.select(m.CHAT_ID, DSL.count().as("count"))
                .from(ms)
                .join(m).on(ms.MESSAGE_ID.eq(m.MESSAGE_ID))
                .where(ms.USER_ID.eq(userId).and(ms.READ_AT.isNull()))
                .groupBy(m.CHAT_ID)
                .asTable("unread_count");

        // FIXME (chat name and picture) does not work for now and that is ok!
        // Main query
        return dsl.select(c.CHAT_ID, c.NAME, c.PICTURE, userAvatarSubquery.field(u.DISPLAY_NAME), userAvatarSubquery.field(u.PROFILE_PICTURE),
                        lastMessageSubquery.field(m.CONTENT).as("last_message"), lastMessageSubquery.field(m.SENT_AT).as("last_message_time"),
                        DSL.coalesce(unreadSubquery.field("count", Long.class), 0L).as("unread_count"), DSL.val(true).as("recipientOnline"))
                .from(c)
                .join(cp).on(c.CHAT_ID.eq(cp.CHAT_ID))
                .join(userAvatarSubquery).on(DSL.trueCondition())
                .leftJoin(lastMessageSubquery).on(DSL.trueCondition())
                .leftJoin(unreadSubquery).on(unreadSubquery.field(m.CHAT_ID).eq(c.CHAT_ID))
                .where(cp.USER_ID.eq(userId))
                .orderBy(lastMessageSubquery.field(m.SENT_AT).desc().nullsLast())
                .fetchInto(ChatDto.class);
    }


}
