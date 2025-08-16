package com.grad.social.model.chat;

import lombok.Data;

import java.time.Instant;

@Data
public final class MessageDto {
    private Long chatId;
    private Long messageId;
    private Long senderId;
    private String content;
    private Instant sentAt;
}