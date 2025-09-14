package com.grad.social.service.chat.event;

public record MessageSavedEvent(Long chatId, Long messageId, Long senderId) {
}
