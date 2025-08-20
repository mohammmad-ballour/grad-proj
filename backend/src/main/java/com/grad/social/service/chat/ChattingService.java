package com.grad.social.service.chat;

import com.grad.social.model.chat.request.CreateMessageRequest;
import com.grad.social.model.chat.response.ChatMessageResponse;
import com.grad.social.model.chat.response.ChatResponse;
import com.grad.social.model.chat.response.MessageDetailResponse;
import com.grad.social.model.user.response.UserResponse;
import com.grad.social.repository.chat.ChattingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ChattingService {
    private final ChattingRepository chattingRepository;

    // chats
    public Long createGroupChat(Long creatorId, String groupName, MultipartFile groupPicture, Set<Long> participantIds) throws IOException {
        byte[] pictureBytes = null;
        if (groupPicture != null && !groupPicture.isEmpty()) {
            pictureBytes = groupPicture.getBytes();
        }
        return this.chattingRepository.createGroupChat(creatorId, groupName, pictureBytes, participantIds);
    }

    public List<UserResponse> searchUsersToAddToGroup(Long currentUserId) {
        return this.chattingRepository.getCandidateGroupMembers(currentUserId);
    }

    public List<UserResponse> searchUsersToAddToMessage(Long currentUserId) {
        return this.chattingRepository.getCandidateGroupMembers(currentUserId);
    }

    public List<ChatMessageResponse> getChatMessagesByRecipientId(Long currentUserId, Long recipientId) {
        var messages = this.chattingRepository.getChatMessagesByRecipientId(currentUserId, recipientId);
        if (messages.isEmpty()) {
            this.getExistingOrCreateNewOneToOneChat(currentUserId, recipientId);
        }
        return messages;
    }

    public List<ChatMessageResponse> getChatMessagesByChatId(Long chatId) {
        return this.chattingRepository.getChatMessagesByChatId(chatId);
    }

    public List<ChatResponse> getChatListForUserByUserId(Long userId) {
        return this.chattingRepository.getChatListForUserByUserId(userId);
    }

    public void deleteConversation(Long chatId, Long currentUserId) {
        this.chattingRepository.deleteConversation(chatId, currentUserId);
    }

    public void pinConversation(Long chatId, Long currentUserId) {
        this.chattingRepository.pinConversation(chatId, currentUserId);
    }

    public void muteConversation(Long chatId, Long currentUserId) {
        this.chattingRepository.muteConversation(chatId, currentUserId);
    }

    // messages
    public Long saveMessage(CreateMessageRequest createMessageRequest, Long chatId, Long senderId) {
        // Save message to message table
        Long savedMessageId = this.chattingRepository.saveMessage(createMessageRequest, chatId, senderId);

        // Initialize message_status for all participants except sender
        this.chattingRepository.initializeMessageStatusForParticipantsExcludingTheSender(savedMessageId, chatId, senderId);
        return savedMessageId;
    }

    public MessageDetailResponse getMessageDetails(Long messageId) {
        return this.chattingRepository.getMessageDetails(messageId);
    }

    // used in FeedService to update unread message count badge in frontend
    public Integer getNumberOfUnreadMessagesSinceLastOnline(Long userId) {
        return this.chattingRepository.getNumberOfUnreadMessagesSinceLastOnline(userId);
    }

    public boolean isParticipant(Long chatId, Long userId) {
        return this.chattingRepository.isParticipant(chatId, userId);
    }

    // called whenever the user comes online again (in LoginSuccessEventHandler)
    public void confirmDelivery(Long userId) {
        this.chattingRepository.updateDeliveryStatusForUserId(userId);
    }

    public void updateReadStatusForMessagesInChat(Long chatId, Long userId) {
        this.chattingRepository.updateReadStatusForMessagesInChat(chatId, userId);
    }

    private void getExistingOrCreateNewOneToOneChat(Long senderId, Long recipientId) {
        Long existentChatID = this.chattingRepository.isOneToOneChatAlreadyExists(senderId, recipientId);
        if (existentChatID == null) {
            // create new chat and add participants
            this.chattingRepository.createOneToOneChat(senderId, recipientId);
        }
    }

}
