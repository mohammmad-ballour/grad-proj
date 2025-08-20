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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<List<ChatResponse>> getChatListForUserByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(this.chatService.getChatListForUserByUserId(userId));
    }

    @PostMapping("/chats/group")
    @ResponseStatus(code = HttpStatus.CREATED)
    @SneakyThrows
    public Long createGroupChat(@RequestParam Long creatorId, @RequestParam String groupName, @RequestBody Set<Long> participantIds,
                                @RequestParam(required = false) MultipartFile groupPicture) {
        return this.chatService.createGroupChat(creatorId, groupName, groupPicture, participantIds);
    }

    @DeleteMapping("/chats/{chatId}")
    @ResponseStatus(code = HttpStatus.NO_CONTENT)
    @PreAuthorize("@SecurityService.isParticipantInChat(#jwt, #chatId)")
    public void deleteConversation(@AuthenticationPrincipal Jwt jwt, @PathVariable Long chatId) {
        long userId = Long.parseLong(jwt.getClaimAsString("uid"));
        this.chatService.deleteConversation(chatId, userId);
    }

    @PatchMapping("/chats/{chatId}/pin")
    @ResponseStatus(code = HttpStatus.NO_CONTENT)
    @PreAuthorize("@SecurityService.isParticipantInChat(#jwt, #chatId)")
    public void pinConversation(@AuthenticationPrincipal Jwt jwt, @PathVariable Long chatId) {
        long userId = Long.parseLong(jwt.getClaimAsString("uid"));
        this.chatService.pinConversation(chatId, userId);
    }

    @PatchMapping("/chats/{chatId}/mute")
    @ResponseStatus(code = HttpStatus.NO_CONTENT)
    @PreAuthorize("@SecurityService.isParticipantInChat(#jwt, #chatId)")
    public void muteConversation(@AuthenticationPrincipal Jwt jwt, @PathVariable Long chatId) {
        long userId = Long.parseLong(jwt.getClaimAsString("uid"));
        this.chatService.muteConversation(chatId, userId);
    }

    // messages
    @PostMapping("/chats/{chatId}/sendMessage")
    @ResponseStatus(code = HttpStatus.CREATED)
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

    // when the user/group avatar in the chat list is clicked, this method is called
    @GetMapping("/chats/{chatId}/chat-messages")
    @PreAuthorize("@SecurityService.isParticipantInChat(#jwt, #chatId)")
    public ResponseEntity<List<MessageResponse>> getChatMessagesByChatId(@AuthenticationPrincipal Jwt jwt, @PathVariable Long chatId) {
        return ResponseEntity.ok(this.chatService.getChatMessagesByChatId(chatId));
    }

    // when the 'message' button is clicked on recipientId's profile by currentUserId, this method is called
    @GetMapping("/chats/{recipientId}/user-messages")
    @PreAuthorize("@SecurityService.isPermittedToMessage(#jwt, #recipientId)")
    public ResponseEntity<List<MessageResponse>> getChatMessagesByRecipientId(@AuthenticationPrincipal Jwt jwt, @PathVariable Long recipientId) {
        long senderId = Long.parseLong(jwt.getClaimAsString("uid"));
        return ResponseEntity.ok(this.chatService.getChatMessagesByRecipientId(senderId, recipientId));
    }

}
