package com.grad.social.model.chat.response;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import lombok.Data;

import java.time.Instant;

@Data
public class ChatResponse {
    @JsonSerialize(using = ToStringSerializer.class)
    private Long chatId;
    private String name;
    private byte[] chatPicture;
    private String lastMessage;
    private Instant lastMessageTime;
    private String messageType;
    private Long unreadCount;
    private int chatMembersNumber;
    private int onlineRecipientsNumber;
    private boolean isPinned;
    private boolean isMuted;
    private boolean isGroup;
}
