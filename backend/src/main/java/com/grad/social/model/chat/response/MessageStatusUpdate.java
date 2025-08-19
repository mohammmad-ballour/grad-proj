package com.grad.social.model.chat.response;

import lombok.Data;

import java.time.Instant;

@Data
public class MessageStatusUpdate {
    private Long messageId;
    private Long userId;
    private boolean delivered;
    private boolean read;
    private Instant deliveredAt;
    private Instant readAt;
}
