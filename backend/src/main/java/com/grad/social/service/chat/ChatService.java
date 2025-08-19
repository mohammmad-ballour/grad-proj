package com.grad.social.service.chat;

import com.grad.social.model.chat.response.ChatResponse;
import com.grad.social.model.chat.response.MessageResponse;
import com.grad.social.repository.chat.ChatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ChatService {
    private final ChatRepository chatRepository;

    public Long getExistingOrCreateNewOneOnOneChat(Long senderId, Long recipientId) {
        Long existentChatID = this.chatRepository.isOneToOneChatAlreadyExists(senderId, recipientId);
        if (existentChatID == null) {
            // create new chat and add participants
            existentChatID = this.chatRepository.createOneToOneChat(senderId, recipientId);
        }
        return existentChatID;
    }

    public Long createGroupChat(Long creatorId, String groupName, MultipartFile groupPicture, Set<Long> participantIds) throws IOException {
        byte[] pictureBytes = null;
        if (groupPicture != null && !groupPicture.isEmpty()) {
            pictureBytes = groupPicture.getBytes();
        }
        return this.chatRepository.createGroupChat(creatorId, groupName, pictureBytes, participantIds);
    }

    public boolean isParticipant(Long chatId, Long userId) {
        return this.chatRepository.isParticipant(chatId, userId);
    }

    public List<MessageResponse> getChatMessagesByChatId(Long chatId) {
        return this.chatRepository.getChatMessagesByChatId(chatId);
    }

    // when the 'message' button or user avatar list on the search bar is clicked on recipientId's profile by currentUserId, this method is called
    public List<MessageResponse> getChatMessagesByRecipientId(Long currentUserId, Long recipientId) {
        return this.chatRepository.getChatMessagesByRecipientId(currentUserId, recipientId);
    }

    public List<ChatResponse> getChatListForUserByUserId(Long userId) {
        return this.chatRepository.getChatListForUserByUserId(userId);
    }
}
