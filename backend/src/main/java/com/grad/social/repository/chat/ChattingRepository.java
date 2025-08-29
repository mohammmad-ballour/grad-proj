package com.grad.social.repository.chat;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.grad.social.common.AppConstants;
import com.grad.social.common.database.utils.TsidUtils;
import com.grad.social.common.messaging.redis.RedisConstants;
import com.grad.social.common.utils.media.MediaStorageService;
import com.grad.social.model.chat.request.CreateMessageRequest;
import com.grad.social.model.chat.response.ChatMessageResponse;
import com.grad.social.model.chat.response.ChatResponse;
import com.grad.social.model.chat.response.MessageDetailResponse;
import com.grad.social.model.enums.MediaType;
import com.grad.social.model.shared.UserAvatar;
import com.grad.social.model.tables.*;
import com.grad.social.model.user.response.UserResponse;
import com.grad.social.repository.user.UserUserInteractionRepository;
import io.hypersistence.tsid.TSID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.jooq.Field;
import org.jooq.impl.DSL;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;

import static com.grad.social.model.chat.response.MessageStatus.*;
import static org.jooq.Records.mapping;
import static org.jooq.impl.DSL.lateral;
import static org.jooq.impl.DSL.row;

@Repository
@RequiredArgsConstructor
public class ChattingRepository {

    private final RedisTemplate<String, String> redisTemplate;
    private final DSLContext dsl;
    private final TSID.Factory tsidFactory = TsidUtils.getTsidFactory(2);
    private final UserUserInteractionRepository userUserInteractionRepository;
    private final ObjectMapper objectMapper;
    private final MediaStorageService mediaStorageService;

    // Aliases for subqueries
    private final Messages m = Messages.MESSAGES;
    private final MessageStatus ms = MessageStatus.MESSAGE_STATUS;
    private final Chats c = Chats.CHATS;
    private final ChatParticipants cp = ChatParticipants.CHAT_PARTICIPANTS.as("cp");
    private final ChatParticipants cp2 = ChatParticipants.CHAT_PARTICIPANTS.as("cp2");
    private final Users u = Users.USERS;
    private final MediaAsset ma = MediaAsset.MEDIA_ASSET;
    private final UserFollowers uf1 = UserFollowers.USER_FOLLOWERS.as("uf1");
    private final UserFollowers uf2 = UserFollowers.USER_FOLLOWERS.as("uf2");
    private final UserFollowers uf3 = UserFollowers.USER_FOLLOWERS.as("uf3");

    // chats
    @Retryable(retryFor = {DuplicateKeyException.class}, maxAttempts = 5, backoff = @Backoff(delay = 500))
    public Long createOneToOneChat(Long senderId, Long recipientId) {
        // Create chat
        Long chatId = dsl.insertInto(c, c.CHAT_ID, c.IS_GROUP_CHAT)
                .values(tsidFactory.generate().toLong(), false)
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

    @Retryable(retryFor = {DuplicateKeyException.class}, maxAttempts = 5, backoff = @Backoff(delay = 500))
    public Long createGroupChat(Long creatorId, String groupName, byte[] groupPicture, Set<Long> participantIds) {
        // Create group chat
        Long chatId = dsl.insertInto(c)
                .set(c.CHAT_ID, tsidFactory.generate().toLong())
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

    public List<UserResponse> getCandidateUsersToMessageOrAddToGroup(Long currentUserId, String nameToSearch, int offset) {
        return this.userUserInteractionRepository.searchOtherUsers(currentUserId, nameToSearch, offset);
    }

    public List<ChatResponse> getChatListForUserByUserId(Long currentUserId) {
        // LATERAL: last message per chat
        var lm = dsl.select(m.CONTENT, m.SENT_AT, m.MESSAGE_TYPE)
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

        var cpOther = cp.as("cp_other");
        return dsl.selectDistinct(
                        c.CHAT_ID,
                        c.IS_GROUP_CHAT,
                        cp.LAST_DELETED_AT,
                        DSL.case_()
                                .when(c.IS_GROUP_CHAT.isTrue(), c.NAME)
                                .otherwise(u.DISPLAY_NAME).as("chat_name"),
                        DSL.case_()
                                .when(c.IS_GROUP_CHAT.isTrue(), c.PICTURE)
                                .otherwise(u.PROFILE_PICTURE).as("chat_picture"),
                        cp.IS_MUTED, cp.IS_PINNED,
                        lm.field(m.CONTENT).as("last_message"),
                        lm.field(m.SENT_AT).as("last_message_time"),
                        lm.field(m.MESSAGE_TYPE).as("message_type"),
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
                .leftJoin(cpOther).on(cpOther.CHAT_ID.eq(c.CHAT_ID).and(cpOther.USER_ID.ne(currentUserId)))
                .join(u).on(u.ID.eq(cpOther.USER_ID))
                .leftJoin(lateral(lm)).on(DSL.trueCondition())
                .leftJoin(uc).on(uc.field(m.CHAT_ID).eq(c.CHAT_ID))
                .where(cp.USER_ID.eq(currentUserId))
                .and(c.IS_GROUP_CHAT.isTrue().or(
                        (lm.field(m.SENT_AT).isNull().or(lm.field(m.SENT_AT).gt(DSL.coalesce(cp.LAST_DELETED_AT, DSL.val(AppConstants.DEFAULT_MIN_TIMESTAMP)))))
                ))
                .orderBy(lm.field(m.SENT_AT).desc().nullsLast())
                .fetch(mapping((chatId, isGroup, lastDeletedAt, chatName, chatPicture, isMuted, isPinned, lastMessage,
                                lastMessageSentAt, lastMessageType, unreadCount, participants) -> {
                    ChatResponse res = new ChatResponse();
                    res.setChatId(chatId);
                    res.setName(chatName);
                    res.setChatPicture(chatPicture);
                    if (isGroup && (lastDeletedAt != null && lastDeletedAt.isAfter(lastMessageSentAt))) {
                        res.setLastMessage(null);
                        res.setLastMessageTime(null);
                    } else {
                        res.setLastMessage(lastMessage);
                        res.setLastMessageTime(lastMessageSentAt);
                    }
                    res.setMessageType(lastMessageType == null ? null : lastMessageType.name());
                    res.setUnreadCount(unreadCount);
                    res.setPinned(isPinned);
                    res.setMuted(isMuted);
                    res.setChatMembersNumber(participants.size());
                    AtomicInteger onlineUsersCount = new AtomicInteger();
                    participants.forEach(participant -> {
                        boolean userOnline = isUserOnline(participant);
                        if (userOnline) onlineUsersCount.getAndIncrement();
                    });
                    res.setOnlineRecipientsNumber(onlineUsersCount.get());
                    return res;
                }));
    }

    public List<ChatMessageResponse> getChatMessagesByChatId(Long currentUserId, Long chatId) {
        // scalar subquery: count how many participants still haven't read
        Field<Integer> unreadCountField = DSL
                .selectCount()
                .from(ms)
                .where(ms.MESSAGE_ID.eq(m.MESSAGE_ID)
                        .and(ms.USER_ID.ne(m.SENDER_ID)) // exclude sender
                        .and(ms.READ_AT.isNull()))
                .asField("unread_count");

        // scalar subquery: count how many participants still haven't received
        Field<Integer> undeliveredCountField = DSL
                .selectCount()
                .from(ms)
                .where(ms.MESSAGE_ID.eq(m.MESSAGE_ID)
                        .and(ms.USER_ID.ne(m.SENDER_ID))
                        .and(ms.DELIVERED_AT.isNull()))
                .asField("undelivered_count");

        return dsl.selectDistinct(m.MESSAGE_ID, m.PARENT_MESSAGE_ID, u.ID, u.USERNAME, u.DISPLAY_NAME, u.PROFILE_PICTURE, m.CONTENT, m.SENT_AT,
                        ma.MEDIA_ID, ma.FILENAME_HASH, ma.EXTENSION, unreadCountField, undeliveredCountField)
                .from(m)
                .leftJoin(ma).on(m.MEDIA_ID.eq(ma.MEDIA_ID))
                .join(ms).on(ms.MESSAGE_ID.eq(m.MESSAGE_ID))
                .join(cp).on(cp.CHAT_ID.eq(m.CHAT_ID))
                .join(u).on(m.SENDER_ID.eq(u.ID))
                .where(m.CHAT_ID.eq(chatId)
                        .and(cp.USER_ID.eq(currentUserId))
                        .and(m.SENT_AT.gt(DSL.coalesce(cp.LAST_DELETED_AT, DSL.val(AppConstants.DEFAULT_MIN_TIMESTAMP))))
                )
                .orderBy(m.SENT_AT.asc())
                .fetch(mapping((messageId, parentMessageId, senderId, senderUsername, senderDisplayName, senderProfilePicture, content, sentAt,
                                mediaId, fileNameHashed, extension, unreadCount, undeliveredCount) -> {
                    com.grad.social.model.chat.response.MessageStatus messageStatus = SENT;
                    if (unreadCount == 0) {
                        messageStatus = READ;
                    } else if (undeliveredCount == 0) {
                        messageStatus = DELIVERED;
                    }
                    byte[] media = null;
                    if (mediaId != null) {
                        try {
                            media = this.mediaStorageService.loadFile(fileNameHashed, extension).readAllBytes();
                        } catch (Exception e) {
                            throw new RuntimeException(e);
                        }
                    }
                    return new ChatMessageResponse(messageId, parentMessageId, new UserAvatar(senderId, senderUsername, senderDisplayName, senderProfilePicture), content, media, sentAt, messageStatus);
                }));
    }

    public void deleteConversation(Long chatId, Long userId) {
        dsl.update(cp)
                .set(cp.LAST_DELETED_AT, Instant.now())
                .where(cp.CHAT_ID.eq(chatId).and(cp.USER_ID.eq(userId)))
                .execute();
    }

    public void pinConversation(Long chatId, Long userId, boolean toPin) {
        dsl.update(cp)
                .set(cp.IS_PINNED, toPin)
                .where(cp.CHAT_ID.eq(chatId).and(cp.USER_ID.eq(userId)))
                .execute();
    }

    public void muteConversation(Long chatId, Long userId, boolean toMute) {
        dsl.update(cp)
                .set(cp.IS_MUTED, toMute)
                .where(cp.CHAT_ID.eq(chatId).and(cp.USER_ID.eq(userId)))
                .execute();
    }

    // messages and their statuses
    public Long saveMessage(Long chatId, Long senderId, Long parentMessageId, MediaType messageType, CreateMessageRequest messageRequest, Long mediaAssetId) {
        return dsl.insertInto(m, m.CHAT_ID, m.SENDER_ID, m.PARENT_MESSAGE_ID, m.CONTENT, m.MEDIA_ID, m.MESSAGE_TYPE)
                .values(chatId, senderId, parentMessageId, messageRequest.content(), mediaAssetId, messageType)
                .returning(m.MESSAGE_ID)
                .fetchOne()
                .getMessageId();
    }

    public MessageDetailResponse getMessageDetails(Long messageId) {
        return dsl.select(DSL.boolAnd(ms.DELIVERED_AT.isNotNull()).as("delivered"),
                        DSL.boolAnd(ms.READ_AT.isNotNull()).as("read"),
                        DSL.jsonbObjectAgg(u.ID.cast(String.class), ms.READ_AT)
                                .filterWhere(ms.READ_AT.isNotNull())
                                .as("read_by_at"),
                        DSL.jsonbObjectAgg(u.ID.cast(String.class), ms.DELIVERED_AT)
                                .filterWhere(ms.DELIVERED_AT.isNotNull())
                                .as("delivered_by_at")
                )
                .from(m)
                .join(ms).on(ms.MESSAGE_ID.eq(m.MESSAGE_ID))
                .join(u).on(u.ID.eq(ms.USER_ID))
                .where(m.MESSAGE_ID.eq(messageId))
                .groupBy(m.MESSAGE_ID)
                .orderBy(m.SENT_AT.asc())
                .fetchOne(mapping((isDelivered, isRead, readByAt, deliveredByAt) -> {
                    MessageDetailResponse res = new MessageDetailResponse();
                    res.setDelivered(isDelivered);
                    res.setRead(isRead);
                    try {
                        Map<String, Object> readByAtMap = this.objectMapper.readValue(readByAt.data(), Map.class);
                        Map<String, Object> deliveredByAtMap = this.objectMapper.readValue(deliveredByAt.data(), Map.class);

                        Map<Long, Instant> realReadMap = new HashMap<>();
                        Map<Long, Instant> realDeliveredMap = new HashMap<>();

                        for (Map.Entry<String, Object> entry : readByAtMap.entrySet()) {
                            Long k = Long.parseLong(entry.getKey());
                            Instant v = Instant.parse(entry.getValue().toString());
                            realReadMap.put(k, v);
                        }
                        res.setReadByAt(realReadMap);

                        for (Map.Entry<String, Object> entry : deliveredByAtMap.entrySet()) {
                            Long k = Long.parseLong(entry.getKey());
                            Instant v = Instant.parse(entry.getValue().toString());
                            if (realReadMap.containsKey(k)) {
                                continue;
                            }
                            realDeliveredMap.put(k, v);
                        }
                        res.setDeliveredByAt(realDeliveredMap);
                    } catch (JsonProcessingException e) {
                        throw new RuntimeException(e);
                    }
                    return res;
                }));
    }

    public List<Long> getMessageRecipientsExcludingSender(Long chatId) {
        return dsl.select(cp.USER_ID)
                .from(cp)
                .where(cp.CHAT_ID.eq(chatId))
                .fetch(cp.USER_ID);
    }

    // excluding the sender is in the service
    public void initializeMessageStatusForParticipants(Long messageId, Long chatId, Long senderId, List<Long> onlineRecipients) {
        dsl.insertInto(ms, ms.MESSAGE_ID, ms.USER_ID, ms.DELIVERED_AT)
                .select(
                        dsl.select(DSL.val(messageId), cp.USER_ID,
                                        DSL.when(cp.USER_ID.in(onlineRecipients), Instant.now())
                                                .otherwise(DSL.val((Instant) null)))
                                .from(cp)
                                .where(cp.CHAT_ID.eq(chatId).and(cp.USER_ID.ne(senderId)))
                )
                .execute();
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

    public void updateDeliveryStatusForUserId(Long userId) {
        dsl.update(ms)
                .set(ms.DELIVERED_AT, Instant.now())
                .where(ms.USER_ID.eq(userId).and(ms.DELIVERED_AT.isNull()))
                .execute();
    }

    public void updateReadStatusForMessagesInChat(Long chatId, Long userId) {
        dsl.update(ms)
                .set(ms.READ_AT, Instant.now())
                .where(ms.USER_ID.eq(userId)).and(ms.READ_AT.isNull())
                .and(ms.MESSAGE_ID.in(
                        DSL.select(m.MESSAGE_ID)
                                .from(m)
                                .where(m.CHAT_ID.eq(chatId))
                ))
                .execute();
    }

    public Long isOneToOneChatAlreadyExists(Long userA, Long userB) {
        return dsl.selectDistinct(c.CHAT_ID)
                .from(c)
                .join(cp).on(c.CHAT_ID.eq(cp.CHAT_ID))
                .join(cp2).on(c.CHAT_ID.eq(cp2.CHAT_ID))
                .where(c.IS_GROUP_CHAT.isFalse().and(
                                (cp.USER_ID.eq(userA).and(cp2.USER_ID.eq(userB)))
                                        .or(cp.USER_ID.eq(userB).and(cp2.USER_ID.eq(userA)))
                        )
                )
                .fetchOneInto(Long.class);
    }

    // Utils
    public boolean isUserOnline(Long userId) {
        Long size = redisTemplate.opsForSet().size(RedisConstants.USERS_SESSION_KEY_PREFIX + userId);
        return size != null && size > 0;
    }

    public boolean isParticipant(Long chatId, Long userId) {
        return dsl.fetchExists(
                dsl.selectOne()
                        .from(cp)
                        .where(cp.CHAT_ID.eq(chatId))
                        .and(cp.USER_ID.eq(userId))
        );
    }

    public boolean isSelfMessage(Long userId, Long messageId) {
        return dsl.fetchExists(
                dsl.selectOne()
                        .from(m)
                        .where(m.MESSAGE_ID.eq(messageId).and(m.SENDER_ID.eq(userId)))
        );
    }

}
