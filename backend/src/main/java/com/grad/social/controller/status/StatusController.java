package com.grad.social.controller.status;

import com.grad.social.model.status.response.StatusWithRepliesResponse;
import com.grad.social.service.user.UserStatusInteractionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
