package com.grad.social.controller.user;

import com.grad.social.common.security.CurrentUser;
import com.grad.social.model.SeekRequest;
import com.grad.social.model.UserSeekResponse;
import com.grad.social.model.user.MuteDuration;
import com.grad.social.model.user.UpdatePriority;
import com.grad.social.service.user.UserUserInteractionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserUserInteractionsController {
    private final UserUserInteractionService userInteractionService;

    // Find followers
    @GetMapping("/{userId}/followers")
    @PreAuthorize("permitAll()")
    public ResponseEntity<List<UserSeekResponse>> retrieveFollowerList(@PathVariable Long userId, @RequestBody(required = false) SeekRequest lastPage) {
        return ResponseEntity.ok(this.userInteractionService.retrieveFollowerList(userId, lastPage));
    }

    // Find followings
    @GetMapping("/{userId}/followings")
    @PreAuthorize("permitAll()")
    public ResponseEntity<List<UserSeekResponse>> retrieveFollowingList(@PathVariable Long userId, @RequestBody(required = false) SeekRequest lastPage) {
        return ResponseEntity.ok(this.userInteractionService.retrieveFollowingList(userId, lastPage));
    }

    // Find followings
    @GetMapping("/{userId}/mutual-followings")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<UserSeekResponse>> retrieveMutualFollowings(@AuthenticationPrincipal CurrentUser currentUser, @PathVariable Long userId, @RequestBody(required = false) SeekRequest lastPage) {
        return ResponseEntity.ok(this.userInteractionService.findMutualFollowings(userId, currentUser.userId(), lastPage));
    }

    // Follow a user
    @PostMapping("/follow/{toFollow}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> followUser(@AuthenticationPrincipal CurrentUser currentUser, @PathVariable Long toFollow) {
        this.userInteractionService.followUser(currentUser.userId(), toFollow);
        return ResponseEntity.ok().build();
    }

    // Unfollow a user
    @PostMapping("/unfollow/{toUnfollow}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> unfollowUser(@AuthenticationPrincipal CurrentUser currentUser, @PathVariable Long toUnfollow) {
        this.userInteractionService.unfollowUser(currentUser.userId(), toUnfollow);
        return ResponseEntity.ok().build();
    }

    // Update following priority
    @PatchMapping("/update-priority/{followedUserId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> updateFollowingPriority(@AuthenticationPrincipal CurrentUser currentUser, @PathVariable long followedUserId, @RequestBody UpdatePriority newPriority) {
        this.userInteractionService.updateFollowingPriority(currentUser.userId(), followedUserId, newPriority.priority());
        return ResponseEntity.ok().build();
    }

    // Retrieve the current user blocklist
    @GetMapping("/block-list")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<UserSeekResponse>> retrieveBlockList(@AuthenticationPrincipal CurrentUser currentUser, @RequestBody(required = false) SeekRequest lastPage) {
        return ResponseEntity.ok(this.userInteractionService.findBlockedUsersWithPagination(currentUser.userId(), lastPage));
    }

    // Block a user
    @PostMapping("/block/{toBlock}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> blockUser(@AuthenticationPrincipal CurrentUser currentUser, @PathVariable Long toBlock) {
        this.userInteractionService.blockUser(currentUser.userId(), toBlock);
        return ResponseEntity.ok().build();
    }

    // Unblock a user
    @PostMapping("/unblock/{toUnblock}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> unblockUser(@AuthenticationPrincipal CurrentUser currentUser, @PathVariable Long toUnblock) {
        this.userInteractionService.unblockUser(currentUser.userId(), toUnblock);
        return ResponseEntity.ok().build();
    }

    // Retrieve the current user mute list
    @GetMapping("/mute-list")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<UserSeekResponse>> retrieveMuteList(@AuthenticationPrincipal CurrentUser currentUser, @RequestBody(required = false) SeekRequest lastPage) {
        return ResponseEntity.ok(this.userInteractionService.findMutedUsersWithPagination(currentUser.userId(), lastPage));
    }

    // Mute a user
    @PostMapping("/mute/{toMute}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> muteUser(@AuthenticationPrincipal CurrentUser currentUser, @PathVariable Long toMute, @RequestBody MuteDuration muteDuration) {
        this.userInteractionService.muteUser(currentUser.userId(), toMute, muteDuration);
        return ResponseEntity.ok().build();
    }

    // Unmute a user
    @PostMapping("/unmute/{toUnmute}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> unmuteUser(@AuthenticationPrincipal CurrentUser currentUser, @PathVariable Long toUnmute) {
        this.userInteractionService.unmuteUser(currentUser.userId(), toUnmute);
        return ResponseEntity.ok().build();
    }
}