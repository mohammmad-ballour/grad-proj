package com.grad.social.controller.chat;

import com.grad.social.model.chat.request.CreateMessageRequest;
import com.grad.social.model.chat.response.ChatMessageResponse;
import com.grad.social.model.chat.response.ChatResponse;
import com.grad.social.model.chat.response.MessageDetailResponse;
import com.grad.social.model.user.response.UserResponse;
import com.grad.social.service.chat.ChattingService;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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
public class ChattingController {
    private final ChattingService chattingService;

    // chats
    @GetMapping("/chats/{userId}/chat-list")
    @PreAuthorize("@SecurityService.hasUserLongId(authentication, #userId)")
    public ResponseEntity<List<ChatResponse>> getChatListForUserByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(this.chattingService.getChatListForUserByUserId(userId));
    }

    @PostMapping("/chats/group")
    @PreAuthorize("@SecurityService.isPermittedToAddToGroup(#jwt, #participantIds)")
    @SneakyThrows
    public ResponseEntity<String> createGroupChat(@AuthenticationPrincipal Jwt jwt, @RequestParam Long creatorId, @RequestParam String groupName,
                                                @RequestBody Set<Long> participantIds, @RequestParam(required = false) MultipartFile groupPicture) {
        return ResponseEntity.status(HttpStatus.CREATED).body(String.valueOf(this.chattingService.createGroupChat(creatorId, groupName, groupPicture, participantIds)));
    }

    @GetMapping("/chats/candidate-users/{nameToSearch}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<UserResponse>> getGroupCandidates(@AuthenticationPrincipal Jwt jwt, @PathVariable String nameToSearch,
                                                                 @RequestParam(defaultValue = "0") int page) {
        long currentUserId = Long.parseLong(jwt.getClaimAsString("uid"));
        return ResponseEntity.ok(this.chattingService.searchUsersToMessageOrAddToGroup(currentUserId, nameToSearch, page));
    }

    // when the user/group avatar in the chat list is clicked, this method is called
    @GetMapping("/chats/{chatId}/chat-messages")
    @PreAuthorize("@SecurityService.isParticipantInChat(#jwt, #chatId)")
    public ResponseEntity<List<ChatMessageResponse>> getChatMessagesByChatId(@AuthenticationPrincipal Jwt jwt, @PathVariable String chatId) {
        return ResponseEntity.ok(this.chattingService.getChatMessagesByChatId(Long.parseLong(chatId)));
    }

    // when the 'message' button is clicked on recipientId's profile by currentUserId, this method is called
    @GetMapping("/chats/{recipientId}")
    @PreAuthorize("@SecurityService.isPermittedToMessage(#jwt, #recipientId)")
    public String getChatIdRecipientId(@AuthenticationPrincipal Jwt jwt, @PathVariable Long recipientId) {
        long senderId = Long.parseLong(jwt.getClaimAsString("uid"));
        var res = String.valueOf(this.chattingService.getExistingOrCreateNewOneToOneChat(senderId, recipientId));
        System.out.println("Returned " + res);
        return res;
    }

    @DeleteMapping("/chats/{chatId}")
    @ResponseStatus(code = HttpStatus.NO_CONTENT)
    @PreAuthorize("@SecurityService.isParticipantInChat(#jwt, #chatId)")
    public void deleteConversation(@AuthenticationPrincipal Jwt jwt, @PathVariable String chatId) {
        long userId = Long.parseLong(jwt.getClaimAsString("uid"));
        this.chattingService.deleteConversation(Long.parseLong(chatId), userId);
    }

    @PatchMapping("/chats/{chatId}/pin")
    @ResponseStatus(code = HttpStatus.NO_CONTENT)
    @PreAuthorize("@SecurityService.isParticipantInChat(#jwt, #chatId)")
    public void pinConversation(@AuthenticationPrincipal Jwt jwt, @PathVariable String chatId) {
        long userId = Long.parseLong(jwt.getClaimAsString("uid"));
        this.chattingService.pinConversation(Long.parseLong(chatId), userId);
    }

    @PatchMapping("/chats/{chatId}/mute")
    @ResponseStatus(code = HttpStatus.NO_CONTENT)
    @PreAuthorize("@SecurityService.isParticipantInChat(#jwt, #chatId)")
    public void muteConversation(@AuthenticationPrincipal Jwt jwt, @PathVariable String chatId) {
        long userId = Long.parseLong(jwt.getClaimAsString("uid"));
        this.chattingService.muteConversation(Long.parseLong(chatId), userId);
    }

    @PostMapping("/chats/{chatId}/confirmRead")
    @PreAuthorize("@SecurityService.isParticipantInChat(#jwt, #chatId)")
    public void updateReadStatusForMessagesInChat(@PathVariable String chatId, @AuthenticationPrincipal Jwt jwt) {
        long userId = Long.parseLong(jwt.getClaimAsString("uid"));
        this.chattingService.updateReadStatusForMessagesInChat(Long.parseLong(chatId), userId);
    }

    // send/reply to a message
    @PostMapping(value = "/chats/{chatId}/sendMessage", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("@SecurityService.isParticipantInChat(#jwt, #chatId)")
    @SneakyThrows
    public ResponseEntity<Long> sendMessage(@AuthenticationPrincipal Jwt jwt, @PathVariable String chatId, @RequestParam(required = false) Long parentMessageId,
                                            @RequestPart("request") CreateMessageRequest createMessage, @RequestPart(value = "attachment", required = false) MultipartFile mediaFile) {
        long senderId = Long.parseLong(jwt.getClaimAsString("uid"));    // User ID from JWT
        return ResponseEntity.status(HttpStatus.CREATED).body(this.chattingService.saveMessage(Long.parseLong(chatId), senderId, parentMessageId, createMessage, mediaFile));
    }

    @GetMapping("/messages/{messageId}/info")
    @PreAuthorize("@SecurityService.isSelfMessage(#jwt, #messageId)")
    public ResponseEntity<MessageDetailResponse> getMessageInfo(@AuthenticationPrincipal Jwt jwt, @PathVariable Long messageId) {
        return ResponseEntity.ok(this.chattingService.getMessageDetails(messageId));
    }

}
