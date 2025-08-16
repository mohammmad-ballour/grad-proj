
package com.grad.social.model.chat;

import lombok.Data;

import java.time.Instant;

@Data
public class ChatDto {
    private Long chatId;
    private String chatName;
    private byte[] chatPicture;
    private String lastMessage;
    private Instant lastMessageTime;
    private Integer unreadCount;
    private boolean recipientOnline;
}
