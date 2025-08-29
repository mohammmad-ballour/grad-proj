package com.grad.social.service.chat;

import com.grad.social.common.model.MediaRepresentation;
import com.grad.social.common.utils.media.MediaStorageService;
import com.grad.social.common.utils.media.MediaUtils;
import com.grad.social.model.chat.request.CreateMessageRequest;
import com.grad.social.model.chat.response.ChatMessageResponse;
import com.grad.social.model.chat.response.ChatResponse;
import com.grad.social.model.chat.response.MessageDetailResponse;
import com.grad.social.model.enums.MediaType;
import com.grad.social.model.user.response.UserResponse;
import com.grad.social.repository.chat.ChattingRepository;
import com.grad.social.repository.media.MediaRepository;
import com.grad.social.service.chat.validator.ChattingValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ChattingService {
    private final ChattingRepository chattingRepository;
    private final MediaRepository mediaRepository;
    private final MediaStorageService mediaStorageService;
    private final ChattingValidator chattingValidator;

    // chats
    public Long createGroupChat(Long creatorId, String groupName, MultipartFile groupPicture, Set<Long> participantIds) throws IOException {
        byte[] pictureBytes = null;
        if (groupPicture != null && !groupPicture.isEmpty()) {
            pictureBytes = groupPicture.getBytes();
        }
        return this.chattingRepository.createGroupChat(creatorId, groupName, pictureBytes, participantIds);
    }

    public List<UserResponse> searchUsersToMessageOrAddToGroup(Long currentUserId, String nameToSearch, int offset) {
        return this.chattingRepository.getCandidateUsersToMessageOrAddToGroup(currentUserId, nameToSearch, offset);
    }

    public Long getExistingOrCreateNewOneToOneChat(Long senderId, Long recipientId) {
        Long chatId = this.chattingRepository.isOneToOneChatAlreadyExists(senderId, recipientId);
        if (chatId == null) {
            System.out.println("Not existing chat, creating new one");
            // create new chat and add participants
            chatId = this.chattingRepository.createOneToOneChat(senderId, recipientId);
        }
        return chatId;
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

    public void pinConversation(Long chatId, Long currentUserId, boolean toPin) {
        this.chattingRepository.pinConversation(chatId, currentUserId, toPin);
    }

    public void muteConversation(Long chatId, Long currentUserId, boolean toMute) {
        this.chattingRepository.muteConversation(chatId, currentUserId, toMute);
    }

    // messages
    public Long saveMessage(Long chatId, Long senderId, Long parentMessageId, CreateMessageRequest createMessageRequest, MultipartFile attachment) throws Exception {
        // validate messsage
        this.chattingValidator.validateCreateMessage(createMessageRequest, attachment);
        Long mediaAssetId = null;
        MediaType messageType = null;

        // upload media to filesystem if any
        if (attachment != null && !attachment.isEmpty()) {
            mediaAssetId = this.uploadMedia(attachment);
            messageType = MediaUtils.getFileType(attachment.getContentType());
        }

        // Save message to message table
        Long savedMessageId = this.chattingRepository.saveMessage(chatId, senderId, parentMessageId, messageType, createMessageRequest, mediaAssetId);

        this.onSaveMessage(chatId, senderId, savedMessageId);
        return savedMessageId;
    }

    @Async
    protected void onSaveMessage(Long chatId, Long senderId, Long savedMessageId) {
        // find recipients of the newly persisted message
        List<Long> messageRecipients = this.chattingRepository.getMessageRecipients(chatId);

        // Initialize message_status for all participants except sender
        List<Long> onLineMessageRecipients = messageRecipients.stream().skip(senderId).filter(this.chattingRepository::isUserOnline).toList();
        this.chattingRepository.initializeMessageStatusForParticipants(savedMessageId, chatId, onLineMessageRecipients);

        // Edit chat status to NORMAL for those who self-deleted it
        this.chattingRepository.editDeletedChatsToNormalAfterNewMessageArrives(chatId, messageRecipients);
    }

    private Long uploadMedia(MultipartFile attachment) throws Exception {
        String hashedContent = MediaUtils.hashFileContent(attachment.getInputStream());
        Long mediaAssetId = this.mediaRepository.findMediaAssetIdsByHashes(Set.of(hashedContent)).get(hashedContent);

        // null means a new media asset, we skip it if it exists
        if (mediaAssetId == null) {
            // Generate hashed filename + keep extension
            String hashedFileName = MediaUtils.hashFileName(attachment.getOriginalFilename());
            String extension = MediaUtils.getExtension(attachment.getOriginalFilename());

            // Save to filesystem: uploads/posts/<hashedFileName>.<ext>
            this.mediaStorageService.saveFile(hashedFileName, extension, attachment.getInputStream());

            // Insert into DB
            var toSave = new MediaRepresentation(hashedFileName, hashedContent, extension, attachment.getContentType(), attachment.getSize());
            mediaAssetId = this.mediaRepository.insertMediaAsset(toSave);
        }
        return mediaAssetId;
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

}
