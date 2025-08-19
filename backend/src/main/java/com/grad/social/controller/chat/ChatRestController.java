package com.grad.social.controller.chat;

import com.grad.social.model.chat.request.ConfirmMessageRequest;
import com.grad.social.model.chat.request.CreateMessageRequest;
import com.grad.social.model.chat.response.ChatResponse;
import com.grad.social.model.chat.response.MessageResponse;
import com.grad.social.model.chat.response.MessageStatusUpdate;
import com.grad.social.service.chat.ChatService;
import com.grad.social.service.chat.MessageService;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Set;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class ChatRestController {

    private final MessageService messageService;
    private final ChatService chatService;

    // chats
    @GetMapping("/chats/{userId}")
    @PreAuthorize("@SecurityService.hasUserLongId(authentication, #userId)")
    public List<ChatResponse> getChatListForUserByUserId(@PathVariable Long userId) {
        return this.chatService.getChatListForUserByUserId(userId);
    }

    @PostMapping("/chats/one-to-one")
    @PreAuthorize("@SecurityService.isPermittedToMessage(#jwt, #recipientId)")
    public Long createOneOnOneChat(@AuthenticationPrincipal Jwt jwt, @RequestParam Long recipientId) {
        long senderId = Long.parseLong(jwt.getClaimAsString("uid"));
        return this.chatService.getExistingOrCreateNewOneOnOneChat(senderId, recipientId);
    }

    @PostMapping("/chats/group")
    @SneakyThrows
    public Long createGroupChat(@RequestParam Long creatorId, @RequestParam String groupName, @RequestBody Set<Long> participantIds,
                                @RequestParam(required = false) MultipartFile groupPicture) {
        return this.chatService.createGroupChat(creatorId, groupName, groupPicture, participantIds);
    }

    // messages
    @PostMapping("/chats/{chatId}/sendMessage")
    @PreAuthorize("@SecurityService.isParticipantInChat(#jwt, #chatId)")
    public Long sendMessage(@PathVariable Long chatId, @RequestBody CreateMessageRequest createMessage, @AuthenticationPrincipal Jwt jwt) {
        long senderId = Long.parseLong(jwt.getClaimAsString("uid"));    // User ID from JWT
        return messageService.saveMessage(createMessage, chatId, senderId); // Save and return persisted message
    }

    @PostMapping("/chats/{chatId}/confirmDelivery")
    @PreAuthorize("@SecurityService.isParticipantInChat(#jwt, #chatId)")
    public MessageStatusUpdate confirmDelivery(@PathVariable Long chatId, @RequestBody ConfirmMessageRequest confirmMessageRequest,
                                               @AuthenticationPrincipal Jwt jwt) {
        long userId = Long.parseLong(jwt.getClaimAsString("uid"));
        return this.messageService.updateDeliveryStatus(confirmMessageRequest.messageId(), userId);
    }

    @PostMapping("/chats/{chatId}/confirmRead")
    @PreAuthorize("@SecurityService.isParticipantInChat(#jwt, #chatId)")
    public MessageStatusUpdate confirmRead(@PathVariable Long chatId, @RequestBody ConfirmMessageRequest confirmMessageRequest,
                                           @AuthenticationPrincipal Jwt jwt) {
        long userId = Long.parseLong(jwt.getClaimAsString("uid"));
        return messageService.updateReadStatus(confirmMessageRequest.messageId(), userId);
    }

    @GetMapping("/chats/{chatId}")
    @PreAuthorize("@SecurityService.isParticipantInChat(#jwt, #chatId)")
    public List<MessageResponse> getChatMessagesByChatId(@AuthenticationPrincipal Jwt jwt, @PathVariable Long chatId) {
        return this.chatService.getChatMessagesByChatId(chatId);
    }

    @GetMapping("/chats/{recipientId}")
    @PreAuthorize("isAuthenticated()")
    public List<MessageResponse> getChatMessagesByRecipientId(@AuthenticationPrincipal Jwt jwt, @PathVariable Long recipientId) {
        return this.chatService.getChatMessagesByChatId(recipientId);
    }

}
