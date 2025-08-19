package com.grad.social.model.chat;

import lombok.Data;

import java.time.Instant;

@Data
public class ChatDto {
    private Long chatId;
    private String name;
    private byte[] chatPicture;
    private String lastMessage;
    private Instant lastMessageTime;
    private Long unreadCount;
    private int onlineRecipientsNumber;
}
