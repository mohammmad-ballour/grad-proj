package com.grad.social.controller.user;

import com.grad.grad_proj.generated.api.model.UserAvatarDto;
import com.grad.social.common.security.CurrentUser;
import com.grad.social.model.SeekRequest;
import com.grad.social.model.enums.FollowingPriority;
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
    public ResponseEntity<List<UserAvatarDto>> retrieveFollowerList(@PathVariable Long userId, @RequestBody(required = false) SeekRequest lastPage) {
        return ResponseEntity.ok(this.userInteractionService.retrieveFollowerList(userId, lastPage));
    }

    // Find followings
    @GetMapping("/{userId}/followings")
    @PreAuthorize("permitAll()")
    public ResponseEntity<List<UserAvatarDto>> retrieveFollowingList(@PathVariable Long userId, @RequestBody(required = false) SeekRequest lastPage) {
        return ResponseEntity.ok(this.userInteractionService.retrieveFollowingList(userId, lastPage));
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
}