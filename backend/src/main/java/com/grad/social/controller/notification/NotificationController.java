package com.grad.social.controller.notification;

import com.grad.social.model.notification.NotificationDto;
import com.grad.social.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService notificationService;

    @GetMapping("/notifications")
    public ResponseEntity<List<NotificationDto>> retrieveNotifications(@AuthenticationPrincipal Jwt jwt, @RequestParam(defaultValue = "0") int page) {
        Long recipientId = Long.parseLong(jwt.getClaimAsString("uid"));
        return ResponseEntity.ok(this.notificationService.allNotifications(recipientId, page));
    }

    @PostMapping("/notifications/mark-as-read")
    public void markAllAsRead(List<Long> unreadNotifications) {
        this.notificationService.markAllAsRead(unreadNotifications);
    }
}
