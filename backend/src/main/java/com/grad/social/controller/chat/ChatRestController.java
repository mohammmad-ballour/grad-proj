package com.grad.social.controller.chat;

import com.grad.social.model.chat.request.CreateMessageRequest;
import com.grad.social.model.chat.response.ChatMessageResponse;
import com.grad.social.model.chat.response.ChatResponse;
import com.grad.social.service.chat.ChattingService;
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
    private final ChattingService chattingService;

    // chats
    @GetMapping("/chats/{userId}")
    @PreAuthorize("@SecurityService.hasUserLongId(authentication, #userId)")
    public ResponseEntity<List<ChatResponse>> getChatListForUserByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(this.chattingService.getChatListForUserByUserId(userId));
    }

    @PostMapping("/chats/group")
    @ResponseStatus(code = HttpStatus.CREATED)
    @SneakyThrows
    public Long createGroupChat(@RequestParam Long creatorId, @RequestParam String groupName, @RequestBody Set<Long> participantIds,
                                @RequestParam(required = false) MultipartFile groupPicture) {
        return this.chattingService.createGroupChat(creatorId, groupName, groupPicture, participantIds);
    }

    // when the user/group avatar in the chat list is clicked, this method is called
    @GetMapping("/chats/{chatId}/chat-messages")
    @PreAuthorize("@SecurityService.isParticipantInChat(#jwt, #chatId)")
    public ResponseEntity<List<ChatMessageResponse>> getChatMessagesByChatId(@AuthenticationPrincipal Jwt jwt, @PathVariable Long chatId) {
        return ResponseEntity.ok(this.chattingService.getChatMessagesByChatId(chatId));
    }

    // when the 'message' button is clicked on recipientId's profile by currentUserId, this method is called
    @GetMapping("/chats/{recipientId}/user-messages")
    @PreAuthorize("@SecurityService.isPermittedToMessage(#jwt, #recipientId)")
    public ResponseEntity<List<ChatMessageResponse>> getChatMessagesByRecipientId(@AuthenticationPrincipal Jwt jwt, @PathVariable Long recipientId) {
        long senderId = Long.parseLong(jwt.getClaimAsString("uid"));
        return ResponseEntity.ok(this.chattingService.getChatMessagesByRecipientId(senderId, recipientId));
    }


    @DeleteMapping("/chats/{chatId}")
    @ResponseStatus(code = HttpStatus.NO_CONTENT)
    @PreAuthorize("@SecurityService.isParticipantInChat(#jwt, #chatId)")
    public void deleteConversation(@AuthenticationPrincipal Jwt jwt, @PathVariable Long chatId) {
        long userId = Long.parseLong(jwt.getClaimAsString("uid"));
        this.chattingService.deleteConversation(chatId, userId);
    }

    @PatchMapping("/chats/{chatId}/pin")
    @ResponseStatus(code = HttpStatus.NO_CONTENT)
    @PreAuthorize("@SecurityService.isParticipantInChat(#jwt, #chatId)")
    public void pinConversation(@AuthenticationPrincipal Jwt jwt, @PathVariable Long chatId) {
        long userId = Long.parseLong(jwt.getClaimAsString("uid"));
        this.chattingService.pinConversation(chatId, userId);
    }

    @PatchMapping("/chats/{chatId}/mute")
    @ResponseStatus(code = HttpStatus.NO_CONTENT)
    @PreAuthorize("@SecurityService.isParticipantInChat(#jwt, #chatId)")
    public void muteConversation(@AuthenticationPrincipal Jwt jwt, @PathVariable Long chatId) {
        long userId = Long.parseLong(jwt.getClaimAsString("uid"));
        this.chattingService.muteConversation(chatId, userId);
    }

    @PostMapping("/chats/{chatId}/confirmRead")
    @PreAuthorize("@SecurityService.isParticipantInChat(#jwt, #chatId)")
    public void updateReadStatusForMessagesInChat(@PathVariable Long chatId, @AuthenticationPrincipal Jwt jwt) {
        long userId = Long.parseLong(jwt.getClaimAsString("uid"));
        this.chattingService.updateReadStatusForMessagesInChat(chatId, userId);
    }

    // send message
    @PostMapping("/chats/{chatId}/sendMessage")
    @ResponseStatus(code = HttpStatus.CREATED)
    @PreAuthorize("@SecurityService.isParticipantInChat(#jwt, #chatId)")
    public Long sendMessage(@PathVariable Long chatId, @RequestBody CreateMessageRequest createMessage, @AuthenticationPrincipal Jwt jwt) {
        long senderId = Long.parseLong(jwt.getClaimAsString("uid"));    // User ID from JWT
        return chattingService.saveMessage(createMessage, chatId, senderId); // Save and return persisted message
    }

}
