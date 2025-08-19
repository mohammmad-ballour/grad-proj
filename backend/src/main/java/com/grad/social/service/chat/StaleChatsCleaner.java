package com.grad.social.service.chat;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jooq.DSLContext;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static com.grad.social.model.tables.Chats.CHATS;
import static com.grad.social.model.tables.Messages.MESSAGES;

@Service
@RequiredArgsConstructor
@Slf4j
public class StaleChatsCleaner {
    private final DSLContext dsl;

    // Runs every 30 minutes
    @Scheduled(cron = "0 */30 * * * *")
    public void cleanStaleOneToOneChats() {
        int days = 7; // configurable: delete chats with no messages for 7 days
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
}
