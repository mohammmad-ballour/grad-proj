package com.grad.social.service.chat;

import com.grad.social.model.chat.ChatDto;
import com.grad.social.model.chat.MessageDto;
import com.grad.social.repository.chat.ChatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ChatService {
    private final ChatRepository chatRepository;

    public Long createOneOnOneChat(Long senderId, Long recipientId) {
        Long existentChatID = this.chatRepository.isOneToOneChatAlreadyExists(senderId, recipientId);
        if(existentChatID == null) {
            existentChatID = this.chatRepository.createOneToOneChat(senderId, recipientId);
        }
        return existentChatID;
    }

    public Long createGroupChat(Long creatorId, String groupName, byte[] groupPicture, Set<Long> participantIds) {
      return this.chatRepository.createGroupChat(creatorId, groupName, groupPicture, participantIds);
    }

    public boolean isParticipant(Long chatId, Long userId) {
        return this.chatRepository.isParticipant(chatId, userId);
    }

    public List<MessageDto> getChatMessagesByChatId(Long chatId) {
        return this.chatRepository.getChatMessagesByChatId(chatId);
    }

    // when 'message' button clicked on recipientId's profile by currentUserId, this method is called
    public List<MessageDto> getChatMessagesByRecipientId(Long currentUserId, Long recipientId) {
        return this.chatRepository.getChatMessagesByRecipientId(currentUserId, recipientId);
    }

    public List<ChatDto> getChatListForUserByUserId(Long userId) {
        return this.chatRepository.getChatListForUserByUserId(userId);
    }
}
