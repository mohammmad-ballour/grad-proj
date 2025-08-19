package com.grad.social.service.chat;

import com.grad.social.model.chat.request.CreateMessageRequest;
import com.grad.social.model.chat.response.MessageStatusUpdate;
import com.grad.social.repository.chat.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class MessageService {
    private final MessageRepository messageRepository;

    public Long saveMessage(CreateMessageRequest createMessageRequest, Long chatId, Long senderId) {
        // Save message to message table
        Long savedMessageId = this.messageRepository.saveMessage(createMessageRequest, chatId, senderId);

        // Initialize message_status for all participants except sender
        this.messageRepository.initializeMessageStatusForParticipantsExcludingTheSender(savedMessageId, chatId, senderId);
        return savedMessageId;
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
