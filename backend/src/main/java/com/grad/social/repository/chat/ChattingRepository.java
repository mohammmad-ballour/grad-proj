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
import com.grad.social.model.chat.response.ParentMessageWithNeighbours;
import com.grad.social.model.enums.MediaType;
import com.grad.social.model.shared.ScrollDirection;
import com.grad.social.model.shared.UserAvatar;
import com.grad.social.model.tables.Users;
import com.grad.social.model.tables.MediaAsset;
import com.grad.social.model.tables.Chats;
import com.grad.social.model.tables.ChatParticipants;
import com.grad.social.model.tables.Messages;
import com.grad.social.model.tables.MessageStatus;

import com.grad.social.model.user.response.UserResponse;
import com.grad.social.repository.user.UserUserInteractionRepository;
import io.hypersistence.tsid.TSID;
import lombok.RequiredArgsConstructor;
import org.jooq.*;
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
import static org.jooq.impl.DSL.*;

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
    private final Messages m2 = Messages.MESSAGES.as("m2");
    private final MessageStatus ms = MessageStatus.MESSAGE_STATUS;
    private final Chats c = Chats.CHATS;
    private final ChatParticipants cp = ChatParticipants.CHAT_PARTICIPANTS.as("cp");
    private final ChatParticipants cp2 = ChatParticipants.CHAT_PARTICIPANTS.as("cp2");
    private final Users u = Users.USERS;
    private final Users u2 = Users.USERS.as("u2");
    private final MediaAsset ma = MediaAsset.MEDIA_ASSET;
    private final MediaAsset ma2 = MediaAsset.MEDIA_ASSET.as("ma2");

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
                .set(c.IS_GROUP_CHAT, true)
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

    public List<ChatResponse> getChatListForUserByUserId(Long currentUserId, int offset) {
        // LATERAL: last message per chat
        var lm = dsl.select(m.CONTENT, m.SENT_AT, m.MESSAGE_TYPE)
                .from(m)
                .where(m.CHAT_ID.eq(c.CHAT_ID))
                .orderBy(m.SENT_AT.desc())
                .limit(1)
                .asTable("lm");

        // unread count per chat
        var uc = dsl.select(m.CHAT_ID, count().as("unread_count"))
                .from(m)
                .join(ms).on(ms.MESSAGE_ID.eq(m.MESSAGE_ID))
                .where(ms.USER_ID.eq(currentUserId).and(ms.READ_AT.isNull()))
                .groupBy(m.CHAT_ID)
                .asTable("uc");

        var cpOther = cp.as("cp_other");
        int pageSize = AppConstants.DEFAULT_PAGE_SIZE;
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
                .orderBy(lm.field(m.SENT_AT).desc().nullsLast())
                .offset(offset * pageSize)
                .limit(pageSize)
                .fetch(mapping((chatId, isGroup, lastDeletedAt, chatName, chatPicture, isMuted, isPinned, lastMessage,
                                lastMessageSentAt, lastMessageType, unreadCount, participants) -> {
                    ChatResponse res = new ChatResponse();
                    res.setChatId(chatId);
                    res.setName(chatName);
                    res.setChatPicture(chatPicture);
                    if (isGroup && (lastDeletedAt != null && lastDeletedAt.isAfter(lastMessageSentAt))) {
                        res.setLastMessage(null);
                        res.setLastMessageTime(null);
                        res.setUnreadCount(0L);
                        res.setMessageType(null);
                    } else {
                        res.setLastMessage(lastMessage);
                        res.setLastMessageTime(lastMessageSentAt);
                        res.setUnreadCount(unreadCount);
                        res.setMessageType(lastMessageType == null ? null : lastMessageType.name());
                    }
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

    public List<ChatMessageResponse> getChatMessagesByChatId(Long currentUserId, Long chatId, ScrollDirection scrollDirection, Long lastMessageId, Instant lastMessageSentAt) {
        if (lastMessageSentAt == null) { // this is the first page
            lastMessageSentAt = AppConstants.DEFAULT_MAX_TIMESTAMP;
        }

        OrderField<Instant> sentAtOrderByField = m.SENT_AT.desc();
        OrderField<Long> messageIdOrderByField = m.MESSAGE_ID.desc();
        if (scrollDirection == ScrollDirection.DOWN) {
            sentAtOrderByField = m.SENT_AT.asc();
            messageIdOrderByField = m.MESSAGE_ID.asc();
        }

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

        return dsl.selectDistinct(m.MESSAGE_ID, u.ID, u.USERNAME, u.DISPLAY_NAME, u.PROFILE_PICTURE, m.CONTENT, m.SENT_AT,
                        m.MESSAGE_TYPE, ma.MEDIA_ID, ma.FILENAME_HASH, ma.EXTENSION, unreadCountField, undeliveredCountField,
                        m2.MESSAGE_ID.as("parent_message_id"), m2.CONTENT.as("parent_content"),
                        u2.DISPLAY_NAME.as("parent_display_name"), u2.PROFILE_PICTURE.as("parent_profile_picture"),
                        ma2.MEDIA_ID.as("parent_media_id"), m2.MESSAGE_TYPE.as("parent_message_type"),
                        ma2.FILENAME_HASH.as("parent_filename_hash"), ma2.EXTENSION.as("parent_extension"))
                .from(m)
                .leftJoin(ma).on(m.MEDIA_ID.eq(ma.MEDIA_ID))
                .leftJoin(m2).on(m.PARENT_MESSAGE_ID.eq(m2.MESSAGE_ID))
                .leftJoin(ma2).on(m2.MEDIA_ID.eq(ma2.MEDIA_ID))
                .leftJoin(ms).on(ms.MESSAGE_ID.eq(m.MESSAGE_ID))
                .leftJoin(cp).on(cp.CHAT_ID.eq(m.CHAT_ID))
                .leftJoin(u).on(m.SENDER_ID.eq(u.ID))
                .leftJoin(u2).on(m2.SENDER_ID.eq(u2.ID))
                .where(m.CHAT_ID.eq(chatId)
                        .and(cp.USER_ID.eq(currentUserId))
                        .and(m.SENT_AT.gt(DSL.coalesce(cp.LAST_DELETED_AT, DSL.val(AppConstants.DEFAULT_MIN_TIMESTAMP))))
                )
                .orderBy(sentAtOrderByField, messageIdOrderByField)
                .seek(lastMessageSentAt, lastMessageId)
                .limit(AppConstants.DEFAULT_PAGE_SIZE)
                .fetch(mapping((messageId, senderId, senderUsername, senderDisplayName, senderProfilePicture, content, sentAt,
                                messageType, mediaId, fileNameHashed, extension, unreadCount, undeliveredCount,
                                parentMessageId, parentContent, parentSenderDisplayName, parentSenderProfilePicture,
                                parentMediaId, parentMessageType, parentFileNameHashed, parentExtension) -> {
                    com.grad.social.model.chat.response.MessageStatus messageStatus = SENT;
                    if (unreadCount == 0) {
                        messageStatus = READ;
                    } else if (undeliveredCount == 0) {
                        messageStatus = DELIVERED;
                    }
                    byte[] media = this.loadMedia(mediaId, fileNameHashed, extension);
                    byte[] parentMedia = this.loadMedia(parentMediaId, parentFileNameHashed, parentExtension);
                    var parentMessageSnippet = parentMessageId == null ? null :
                            new ChatMessageResponse.ParentMessageSnippet(parentMessageId, parentContent, parentSenderDisplayName, parentMessageType, parentMedia);
                    return new ChatMessageResponse(messageId, parentMessageSnippet, new UserAvatar(senderId, senderUsername, senderDisplayName, senderProfilePicture),
                            content, media, messageType, sentAt, messageStatus);
                }));
    }

    public ParentMessageWithNeighbours getParentMessageWithNeighboursInChat(Long chatId, Long messageId, Long lastFetchedMessageIdInPage) {
        int neighboursWindow = 3;

        // 1. Fetch the parent message
        ChatMessageResponse parent = dsl.select(m.MESSAGE_ID, u.ID, u.USERNAME, u.DISPLAY_NAME, u.PROFILE_PICTURE,
                        m.CONTENT, m.SENT_AT, m.MESSAGE_TYPE, ma.MEDIA_ID, ma.FILENAME_HASH, ma.EXTENSION,
                        m2.MESSAGE_ID.as("parent_message_id"), m2.CONTENT.as("parent_content"),
                        u2.DISPLAY_NAME.as("parent_display_name"),
                        ma2.MEDIA_ID.as("parent_media_id"), m2.MESSAGE_TYPE.as("parent_message_type"),
                        ma2.FILENAME_HASH.as("parent_filename_hash"), ma2.EXTENSION.as("parent_extension"))
                .from(m)
                .leftJoin(m2).on(m.PARENT_MESSAGE_ID.eq(m2.MESSAGE_ID))
                .leftJoin(ma).on(m.MEDIA_ID.eq(ma.MEDIA_ID))
                .leftJoin(ma2).on(m2.MEDIA_ID.eq(ma2.MEDIA_ID))
                .leftJoin(u).on(m.SENDER_ID.eq(u.ID))
                .leftJoin(u2).on(m2.SENDER_ID.eq(u2.ID))
                .where(m.MESSAGE_ID.eq(messageId))
                .fetchOne(mapRowToChatMessage());

        if (parent == null) {
//            throw new ModelNotFoundException(Model.MESSAGE, messageId);
        }

        // 2. Fetch 5 previous neighbours
        List<ChatMessageResponse> previousMessages = dsl.selectDistinct(m.MESSAGE_ID, u.ID, u.USERNAME, u.DISPLAY_NAME, u.PROFILE_PICTURE,
                        m.CONTENT, m.SENT_AT, m.MESSAGE_TYPE, ma.MEDIA_ID, ma.FILENAME_HASH, ma.EXTENSION,
                        m2.MESSAGE_ID.as("parent_message_id"), m2.CONTENT.as("parent_content"),
                        u2.DISPLAY_NAME.as("parent_display_name"),
                        ma2.MEDIA_ID.as("parent_media_id"), m2.MESSAGE_TYPE.as("parent_message_type"),
                        ma2.FILENAME_HASH.as("parent_filename_hash"), ma2.EXTENSION.as("parent_extension"))
                .from(m)
                .leftJoin(m2).on(m.PARENT_MESSAGE_ID.eq(m2.MESSAGE_ID))
                .leftJoin(ma).on(m.MEDIA_ID.eq(ma.MEDIA_ID))
                .leftJoin(ma2).on(m2.MEDIA_ID.eq(ma2.MEDIA_ID))
                .leftJoin(u).on(m.SENDER_ID.eq(u.ID))
                .leftJoin(u2).on(m2.SENDER_ID.eq(u2.ID))
                .where(m.CHAT_ID.eq(chatId))
                .and(m.SENT_AT.lt(parent.sentAt()))
                .orderBy(m.SENT_AT.desc())
                .limit(neighboursWindow)
                .fetch(mapRowToChatMessage());

        // 3. Fetch 5 next neighbours
        List<ChatMessageResponse> nextMessages = dsl.selectDistinct(m.MESSAGE_ID, u.ID, u.USERNAME, u.DISPLAY_NAME, u.PROFILE_PICTURE,
                        m.CONTENT, m.SENT_AT, m.MESSAGE_TYPE, ma.MEDIA_ID, ma.FILENAME_HASH, ma.EXTENSION,
                        m2.MESSAGE_ID.as("parent_message_id"), m2.CONTENT.as("parent_content"),
                        u2.DISPLAY_NAME.as("parent_display_name"),
                        ma2.MEDIA_ID.as("parent_media_id"), m2.MESSAGE_TYPE.as("parent_message_type"),
                        ma2.FILENAME_HASH.as("parent_filename_hash"), ma2.EXTENSION.as("parent_extension"))
                .from(m)
                .leftJoin(m2).on(m.PARENT_MESSAGE_ID.eq(m2.MESSAGE_ID))
                .leftJoin(ma).on(m.MEDIA_ID.eq(ma.MEDIA_ID))
                .leftJoin(ma2).on(m2.MEDIA_ID.eq(ma2.MEDIA_ID))
                .leftJoin(u).on(m.SENDER_ID.eq(u.ID))
                .leftJoin(u2).on(m2.SENDER_ID.eq(u2.ID))
                .where(m.CHAT_ID.eq(chatId))
                .and(m.SENT_AT.gt(parent.sentAt()).and(m.MESSAGE_ID.lt(lastFetchedMessageIdInPage)))
                .orderBy(m.SENT_AT.asc())
                .limit(neighboursWindow)
                .fetch(mapRowToChatMessage());

        // 4. Gap logic (count total messages before/after to detect gaps)
        Field<Integer> totalBeforeField = count().filterWhere(m.SENT_AT.lt(parent.sentAt())).as("totalBefore");
        Field<Integer> totalAfterField = count().filterWhere(m.SENT_AT.gt(parent.sentAt()).and(m.MESSAGE_ID.lt(lastFetchedMessageIdInPage))).as("totalAfter");

        // Execute a single query to get both counts
        Record2<Integer, Integer> counts = dsl.select(totalBeforeField, totalAfterField)
                .from(m)
                .where(m.CHAT_ID.eq(chatId))
                .fetchOne();

        int totalBefore = counts.value1();
        int totalAfter = counts.value2();

        ParentMessageWithNeighbours.GapInfo gapBefore = new ParentMessageWithNeighbours.GapInfo(
                totalBefore > previousMessages.size(),
                Math.max(totalBefore - previousMessages.size(), 0),
                previousMessages.isEmpty() ? null : previousMessages.get(previousMessages.size() - 1).messageId(),
                previousMessages.isEmpty() ? null : previousMessages.get(previousMessages.size() - 1).sentAt()
        );

        ParentMessageWithNeighbours.GapInfo gapAfter = new ParentMessageWithNeighbours.GapInfo(
                totalAfter > nextMessages.size(),
                Math.max(totalAfter - nextMessages.size(), 0),
                nextMessages.isEmpty() ? null : nextMessages.get(nextMessages.size() - 1).messageId(),
                nextMessages.isEmpty() ? null : nextMessages.get(nextMessages.size() - 1).sentAt()
        );

        // 5. Assemble ordered list: prev (oldest → newest), parent, next (newest → oldest)
        List<ChatMessageResponse> allMessages = new ArrayList<>();
        allMessages.addAll(previousMessages.reversed()); // chronological
        allMessages.add(parent);
        allMessages.addAll(nextMessages);

        return new ParentMessageWithNeighbours(allMessages, gapBefore, gapAfter);
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
                        Map<String, Object> readByAtMap;
                        if (deliveredByAt == null) {
                            res.setReadByAt(Collections.emptyMap());
                            res.setDeliveredByAt(Collections.emptyMap());
                            return res;
                        }
                        Map<String, Object> deliveredByAtMap = this.objectMapper.readValue(deliveredByAt.data(), Map.class);
                        if (readByAt == null) {
                            readByAtMap = Collections.emptyMap();
                        } else {
                            readByAtMap = this.objectMapper.readValue(readByAt.data(), Map.class);
                        }

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

    private RecordMapper<Record18<Long, Long, String, String, byte[], String, Instant, MediaType, Long, String, String, Long, String, String, Long, MediaType, String, String>, ChatMessageResponse> mapRowToChatMessage() {
        return mapping((messageId2, senderId, senderUsername, senderDisplayName, senderProfilePicture, content, sentAt,
                        messageType, mediaId, fileNameHashed, extension,
                        parentMessageId, parentContent, parentSenderDisplayName, parentMediaId, parentMessageType, parentFileNameHashed, parentExtension) -> {
            byte[] media = this.loadMedia(mediaId, fileNameHashed, extension);
            ChatMessageResponse.ParentMessageSnippet parentMessageSnippet = null;
            if (parentMessageId != null) {
                byte[] parentMedia = this.loadMedia(parentMediaId, parentFileNameHashed, parentExtension);
                parentMessageSnippet = new ChatMessageResponse.ParentMessageSnippet(parentMessageId, parentContent, parentSenderDisplayName, parentMessageType, parentMedia);
            }
            return new ChatMessageResponse(messageId2, parentMessageSnippet, new UserAvatar(senderId, senderUsername, senderDisplayName, senderProfilePicture),
                    content, media, messageType, sentAt, READ);
        });
    }

    private byte[] loadMedia(Long mediaId, String fileNameHashed, String extension) {
        if (mediaId == null) {
            return null;
        }
        try {
            return this.mediaStorageService.loadFile(fileNameHashed, extension).readAllBytes();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

}
