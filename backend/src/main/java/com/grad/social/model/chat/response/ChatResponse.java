package com.grad.social.model.chat.response;

import lombok.Data;

import java.time.Instant;

@Data
public class ChatResponse {
    private Long chatId;
    private String name;
    private byte[] chatPicture;
    private String lastMessage;
    private Instant lastMessageTime;
    private Long unreadCount;
    private int onlineRecipientsNumber;
    private boolean isPinned;
    private boolean isMuted;
    private boolean isDeleted;
}
