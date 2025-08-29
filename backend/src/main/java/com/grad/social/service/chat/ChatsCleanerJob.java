package com.grad.social.service.chat;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jooq.DSLContext;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;

import static com.grad.social.model.tables.Chats.CHATS;
import static com.grad.social.model.tables.Messages.MESSAGES;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatsCleanerJob {
    private final DSLContext dsl;

    /**
     * Runs every 10 minutes to clean up 1-1 chats where which have no messages.
     */    @Scheduled(cron = "0 */10 * * * *")
    public void cleanStaleOneToOneChats() {
        int deleted = dsl.deleteFrom(CHATS)
                .where(CHATS.IS_GROUP_CHAT.isFalse())
                .andNotExists(
                        dsl.selectOne()
                                .from(MESSAGES)
                                .where(MESSAGES.CHAT_ID.eq(CHATS.CHAT_ID))
                )
                .execute();

        if (deleted > 0) {
            log.info("Deleted {} stale chats at {}", deleted, Instant.now());
        }
    }

}
