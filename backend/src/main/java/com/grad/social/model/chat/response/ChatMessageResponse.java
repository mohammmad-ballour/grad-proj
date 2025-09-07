package com.grad.social.model.chat.response;

import com.grad.social.model.shared.UserAvatar;
import com.grad.social.model.enums.MediaType;

import java.time.Instant;

public record ChatMessageResponse(Long messageId, ParentMessageSnippet parentMessageSnippet, UserAvatar senderAvatar, String content,
                               byte[] media,MediaType messageType, Instant sentAt, MessageStatus messageStatus) {

    public record ParentMessageSnippet(Long parentMessageId, String content, Long parentSenderId, String parentSenderDisplayName, MediaType messageType, byte[] media) {}
}

