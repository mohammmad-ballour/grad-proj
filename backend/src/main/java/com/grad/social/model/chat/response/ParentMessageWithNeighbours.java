package com.grad.social.model.chat.response;

import java.time.Instant;
import java.util.List;

public record ParentMessageWithNeighbours(
        List<ChatMessageResponse> messages,
        GapInfo gapBefore,
        GapInfo gapAfter
) {
    public record GapInfo(
            boolean exists,
            int missingCount,
            Long lastMessageId,
            Instant lastMessageSentAt
    ) {}
}


