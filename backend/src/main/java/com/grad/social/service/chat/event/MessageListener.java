package com.grad.social.service.chat.event;

import com.grad.social.repository.chat.ChattingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class MessageListener {
    private final ChattingRepository chattingRepository;
    
    @EventListener(MessageSavedEvent.class)
    public void onSaveMessage(MessageSavedEvent event) {
        Long chatId = event.chatId();
        Long savedMessageId = event.messageId();
        Long senderId = event.senderId();

        // find recipients of the newly persisted message
        List<Long> messageRecipients = this.chattingRepository.getMessageRecipients(chatId);

        // Initialize message_status for all participants except sender
        List<Long> onLineMessageRecipients = messageRecipients.stream().skip(senderId).filter(this.chattingRepository::isUserOnline).toList();
        this.chattingRepository.initializeMessageStatusForParticipants(savedMessageId, chatId, onLineMessageRecipients);
    }
}
