package com.grad.social.model.chat.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

@NoArgsConstructor
@AllArgsConstructor
@Data
public final class MessageDetailResponse {
    private Long messageId;
    private Long senderId;
    private String content;
    private Instant sentAt;
    private boolean delivered;
    private boolean read;
    private Map<Long, Instant> deliveredByAt;
    private Map<Long, Instant> readByAt;
}