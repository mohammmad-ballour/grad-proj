package com.grad.social.service.chat;

import com.grad.social.model.chat.MessageDto;
import com.grad.social.model.chat.MessageStatusUpdate;
import com.grad.social.repository.chat.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MessageService {
    private final MessageRepository messageRepository;

    public MessageDto saveMessage(MessageDto messageDto) {
        // Save message to message table
        Long savedMessageId = this.messageRepository.saveMessage(messageDto);

        // Initialize message_status for all participants except sender
        this.messageRepository.initializeMessageStatusForParticipantsExcludingTheSender(savedMessageId, messageDto.getChatId(), messageDto.getSenderId());
        return messageDto;
    }

    public MessageStatusUpdate updateDeliveryStatus(Long messageId, Long userId) {
        // Update delivery status for the user
        this.messageRepository.updateDeliveryStatus(messageId, userId);

        // Check if all participants (except sender) have delivered
        MessageStatusUpdate statusUpdate = new MessageStatusUpdate();
        statusUpdate.setMessageId(messageId);
        statusUpdate.setUserId(userId);
        statusUpdate.setDelivered(this.messageRepository.isAllDelivered(messageId));
        if (statusUpdate.isDelivered()) {
            statusUpdate.setDeliveredAt(Instant.now());
        }
        return statusUpdate;
    }

    public MessageStatusUpdate updateReadStatus(Long messageId, Long userId) {
        // Update read status for the user
        this.messageRepository.updateReadStatus(messageId, userId);

        // Check if all participants (except sender) have read
        MessageStatusUpdate statusUpdate = new MessageStatusUpdate();
        statusUpdate.setMessageId(messageId);
        statusUpdate.setUserId(userId);
        statusUpdate.setRead(this.messageRepository.isAllRead(messageId));
        if (statusUpdate.isRead()) {
            statusUpdate.setReadAt(Instant.now());
        }
        return statusUpdate;
    }

    // used in FeedService to update unread message count badge in frontend
    public Integer getNumberOfUnreadMessagesSinceLastOnline(Long userId) {
        return this.messageRepository.getNumberOfUnreadMessagesSinceLastOnline(userId);
    }

}
