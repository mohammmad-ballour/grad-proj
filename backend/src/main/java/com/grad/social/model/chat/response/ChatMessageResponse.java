package com.grad.social.model.chat.response;

import java.time.Instant;

public record ChatMessageResponse(Long messageId, Long parentMessageId, Long senderId, String content, Instant sentAt,
                                  MessageStatus messageStatus) {
}

