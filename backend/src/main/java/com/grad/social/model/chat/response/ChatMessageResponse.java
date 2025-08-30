package com.grad.social.model.chat.response;

import com.grad.social.model.shared.UserAvatar;

import java.time.Instant;

public record ChatMessageResponse(Long messageId, Long parentMessageId, UserAvatar senderAvatar, String content,
                                  byte[] media, String messageType, Instant sentAt, MessageStatus messageStatus) {
}

