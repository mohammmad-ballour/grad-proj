package com.grad.social.model.chat;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@NoArgsConstructor
@AllArgsConstructor
@Data
public final class MessageDto {
    private Long chatId;
    private Long messageId;
    private Long senderId;
    private String content;
    private Instant sentAt;
}