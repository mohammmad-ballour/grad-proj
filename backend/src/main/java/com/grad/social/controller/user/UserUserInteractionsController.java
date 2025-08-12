package com.grad.social.controller.user;

import com.grad.social.model.user.MuteDuration;
import com.grad.social.model.user.UpdatePriority;
import com.grad.social.model.user.response.UserSeekResponse;
import com.grad.social.service.user.UserUserInteractionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserUserInteractionsController {
    private final UserUserInteractionService userInteractionService;

    // Find followers
    @GetMapping("/{userId}/followers")
    @PreAuthorize("@SecurityService.canAccessProfileProtectedData(#jwt, #userId)")
    public ResponseEntity<List<UserSeekResponse>> retrieveFollowerList(@AuthenticationPrincipal Jwt jwt, @PathVariable Long userId,
                                                                       @RequestParam(defaultValue = "0") int page) {
        Long uid = Long.parseLong(jwt.getClaimAsString("uid"));
        return ResponseEntity.ok(this.userInteractionService.retrieveFollowerList(userId, uid, page));
    }

    // Find followings
    @GetMapping("/{userId}/followings")
    @PreAuthorize("@SecurityService.canAccessProfileProtectedData(#jwt, #userId)")
    public ResponseEntity<List<UserSeekResponse>> retrieveFollowingList(@AuthenticationPrincipal Jwt jwt, @PathVariable Long userId,
                                                                        @RequestParam(defaultValue = "0") int page) {
        Long uid = Long.parseLong(jwt.getClaimAsString("uid"));
        return ResponseEntity.ok(this.userInteractionService.retrieveFollowingList(userId, uid, page));
    }

    // Find followings
    @GetMapping("/{userId}/mutual-followings")
    @PreAuthorize("@SecurityService.canAccessProfileProtectedData(#jwt, #userId)")
    public ResponseEntity<List<UserSeekResponse>> retrieveMutualFollowings(@AuthenticationPrincipal Jwt jwt, @PathVariable Long userId,
                                                                           @RequestParam(defaultValue = "0") int page) {
        Long uid = Long.parseLong(jwt.getClaimAsString("uid"));
        return ResponseEntity.ok(this.userInteractionService.findFollowersCurrentUserFollowsInUserIdFollowingList(userId, uid, page));
    }

    // Follow a user
    @PostMapping("/follow/{toFollow}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> followUser(@AuthenticationPrincipal Jwt jwt, @PathVariable Long toFollow) {
        Long uid = Long.parseLong(jwt.getClaimAsString("uid"));
        this.userInteractionService.followUser(uid, toFollow);
        return ResponseEntity.ok().build();
    }

    // Unfollow a user
    @PostMapping("/unfollow/{toUnfollow}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> unfollowUser(@AuthenticationPrincipal Jwt jwt, @PathVariable Long toUnfollow) {
        Long uid = Long.parseLong(jwt.getClaimAsString("uid"));
        this.userInteractionService.unfollowUser(uid, toUnfollow);
        return ResponseEntity.ok().build();
    }

    // Update following priority
    @PatchMapping("/update-priority/{followedUserId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> updateFollowingPriority(@AuthenticationPrincipal Jwt jwt, @PathVariable long followedUserId, @RequestBody UpdatePriority newPriority) {
        Long uid = Long.parseLong(jwt.getClaimAsString("uid"));
        this.userInteractionService.updateFollowingPriority(uid, followedUserId, newPriority.priority());
        return ResponseEntity.ok().build();
    }

    // Retrieve the current user blocklist
    @GetMapping("/block-list")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<UserSeekResponse>> retrieveBlockList(@AuthenticationPrincipal Jwt jwt,
                                                                    @RequestParam(defaultValue = "0") int page) {
        Long uid = Long.parseLong(jwt.getClaimAsString("uid"));
        return ResponseEntity.ok(this.userInteractionService.findBlockedUsersWithPagination(uid, page));
    }

    // Block a user
    @PostMapping("/block/{toBlock}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> blockUser(@AuthenticationPrincipal Jwt jwt, @PathVariable Long toBlock) {
        Long uid = Long.parseLong(jwt.getClaimAsString("uid"));
        this.userInteractionService.blockUser(uid, toBlock);
        return ResponseEntity.ok().build();
    }

    // Unblock a user
    @PostMapping("/unblock/{toUnblock}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> unblockUser(@AuthenticationPrincipal Jwt jwt, @PathVariable Long toUnblock) {
        Long uid = Long.parseLong(jwt.getClaimAsString("uid"));
        this.userInteractionService.unblockUser(uid, toUnblock);
        return ResponseEntity.ok().build();
    }

    // Retrieve the current user mute list
    @GetMapping("/mute-list")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<UserSeekResponse>> retrieveMuteList(@AuthenticationPrincipal Jwt jwt,
                                                                   @RequestParam(defaultValue = "0") int page) {
        Long uid = Long.parseLong(jwt.getClaimAsString("uid"));
        return ResponseEntity.ok(this.userInteractionService.findMutedUsersWithPagination(uid, page));
    }

    // Mute a user
    @PostMapping("/mute/{toMute}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> muteUser(@AuthenticationPrincipal Jwt jwt, @PathVariable Long toMute, @RequestBody MuteDuration muteDuration) {
        Long uid = Long.parseLong(jwt.getClaimAsString("uid"));
        this.userInteractionService.muteUser(uid, toMute, muteDuration);
        return ResponseEntity.ok().build();
    }

    // Unmute a user
    @PostMapping("/unmute/{toUnmute}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> unmuteUser(@AuthenticationPrincipal Jwt jwt, @PathVariable Long toUnmute) {
        Long uid = Long.parseLong(jwt.getClaimAsString("uid"));
        this.userInteractionService.unmuteUser(uid, toUnmute);
        return ResponseEntity.ok().build();
    }
}