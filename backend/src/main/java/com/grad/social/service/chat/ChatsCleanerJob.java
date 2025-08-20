package com.grad.social.service.chat;

import com.grad.social.model.enums.ChatStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static com.grad.social.model.tables.ChatParticipants.CHAT_PARTICIPANTS;
import static com.grad.social.model.tables.Chats.CHATS;
import static com.grad.social.model.tables.Messages.MESSAGES;
import static org.jooq.impl.DSL.count;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatsCleanerJob {
    private final DSLContext dsl;

    // Runs every 30 minutes
    @Scheduled(cron = "0 */30 * * * *")
    public void cleanStaleOneToOneChats() {
        int days = 2; // configurable
        Instant cutoff = Instant.now().minus(days, ChronoUnit.DAYS);

        int deleted = dsl.deleteFrom(CHATS)
                .where(CHATS.IS_GROUP_CHAT.isFalse())
                .andNotExists(
                        dsl.selectOne()
                                .from(MESSAGES)
                                .where(MESSAGES.CHAT_ID.eq(CHATS.CHAT_ID))
                )
                .and(CHATS.CREATED_AT.lessOrEqual(cutoff))
                .execute();

        if (deleted > 0) {
            log.info("Deleted {} stale chats at {}", deleted, Instant.now());
        }
    }

    /**
     * Runs every 30 minutes to clean up chats where ALL participants
     * have marked chat_status = 'DELETED'.
     */
    @Scheduled(cron = "0 */30 * * * *")
    public void cleanDeletedChats() {
        // Step 1: find chats where all participants marked the chat DELETED
        List<Long> chatsToClean = dsl.select(CHAT_PARTICIPANTS.CHAT_ID)
                .from(CHAT_PARTICIPANTS)
                .groupBy(CHAT_PARTICIPANTS.CHAT_ID)
                .having(
                        count(CHAT_PARTICIPANTS.USER_ID).eq(
                                count().filterWhere(CHAT_PARTICIPANTS.CHAT_STATUS.eq(ChatStatus.DELETED))
                        )
                )
                .fetch(CHAT_PARTICIPANTS.CHAT_ID);

        if (chatsToClean.isEmpty()) {
            return;
        }

        // Step 2: delete messages (corresponding message_statuses will be deleted automatically)
        dsl.deleteFrom(MESSAGES)
                .where(MESSAGES.CHAT_ID.in(chatsToClean))
                .execute();
    }
}
