package com.grad.social.controller.status;

import com.grad.social.model.shared.TimestampSeekRequest;
import com.grad.social.model.status.request.ReactToStatusRequest;
import com.grad.social.model.status.response.ReplySnippet;
import com.grad.social.model.status.response.StatusWithRepliesResponse;
import com.grad.social.service.user.UserStatusInteractionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class StatusController {
    private final UserStatusInteractionService userStatusInteractionService;

    // fetch status  (open endpoint)
    @GetMapping("/status/public/{statusId}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<StatusWithRepliesResponse> getStatusById(@AuthenticationPrincipal Jwt jwt, @PathVariable String statusId) {
        Long currentUserId = jwt == null? -1 : Long.parseLong(jwt.getClaimAsString("uid"));
        return ResponseEntity.ok(this.userStatusInteractionService.getStatusById(currentUserId, Long.parseLong(statusId)));
    }

    @PostMapping ("/status/{statusId}/replies")
    public ResponseEntity<List<ReplySnippet>> fetchMoreReplies(@AuthenticationPrincipal Jwt jwt, @PathVariable String statusId,
                                                               @RequestBody(required = false) TimestampSeekRequest seekRequest) {
        Long currentUserId = jwt == null? -1 : Long.parseLong(jwt.getClaimAsString("uid"));
        return ResponseEntity.ok(this.userStatusInteractionService.fetchMoreReplies(currentUserId, Long.parseLong(statusId), seekRequest));
    }

    // Like a status
    @PostMapping("/like")
    @PreAuthorize("@SecurityService.canViewStatus(#jwt, #reactRequest)")
    public ResponseEntity<Void> likeStatus(@AuthenticationPrincipal Jwt jwt, @RequestBody ReactToStatusRequest reactRequest) {
        Long uid = Long.parseLong(jwt.getClaimAsString("uid"));
        this.userStatusInteractionService.likeStatus(uid, reactRequest);
        return ResponseEntity.ok().build();
    }

    // Unlike a status
    @PostMapping("/unlike")
    public ResponseEntity<Void> unlikeStatus(@AuthenticationPrincipal Jwt jwt, @RequestBody ReactToStatusRequest reactRequest) {
        Long uid = Long.parseLong(jwt.getClaimAsString("uid"));
        this.userStatusInteractionService.unlikeStatus(uid, reactRequest);
        return ResponseEntity.ok().build();
    }

}
