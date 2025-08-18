package com.grad.social.controller.chat;

import com.grad.social.model.chat.*;
import com.grad.social.service.chat.ChatService;
import com.grad.social.service.chat.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class ChatRestController {

    private final MessageService messageService;
    private final ChatService chatService;

    @PostMapping("/chats/{chatId}/sendMessage")
    @PreAuthorize("@SecurityService.isParticipantInChat(#jwt, #chatId)")
    public MessageDto sendMessage(@PathVariable Long chatId, @RequestBody CreateMessage createMessage, @AuthenticationPrincipal Jwt jwt) {
        long senderId = Long.parseLong(jwt.getClaimAsString("uid"));    // User ID from JWT
        MessageDto messageDto = new MessageDto();
        messageDto.setChatId(chatId);
        messageDto.setSenderId(senderId);
        messageDto.setContent(createMessage.content());
        return messageService.saveMessage(messageDto); // Save and return persisted message
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
    public MessageStatusUpdate confirmRead(
            @PathVariable Long chatId, @RequestBody ConfirmMessageRequest confirmMessageRequest,
            @AuthenticationPrincipal Jwt jwt) {
        long userId = Long.parseLong(jwt.getClaimAsString("uid"));
        return messageService.updateReadStatus(confirmMessageRequest.messageId(), userId);
    }

    @GetMapping("/chats/{userId}")
    @PreAuthorize("@SecurityService.hasUserLongId(authentication, #userId)")
    public List<ChatDto> getChatListForUserByUserId(@PathVariable Long userId) {
        return this.chatService.getChatListForUserByUserId(userId);
    }

    @GetMapping("/chats/{chatId}/messages")
    @PreAuthorize("@SecurityService.isParticipantInChat(#jwt, #chatId)")
    public List<MessageDto> getChatMessages(@PathVariable Long chatId, @AuthenticationPrincipal Jwt jwt) {
        return Collections.emptyList();
    }

    @PostMapping("/chats/one-to-one")
    // TODO: Later, handle the use case when the current user does not follow the recipient and the latter does not allow messages from NON_FOLLOWERS
    public Long createOneOnOneChat(@AuthenticationPrincipal Jwt jwt, @RequestParam Long recipientId) {
        long senderId = Long.parseLong(jwt.getClaimAsString("uid"));
        return this.chatService.createOneOnOneChat(senderId, recipientId);
    }
}
