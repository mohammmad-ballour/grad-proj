package com.grad.social.service.notification;

import com.grad.social.model.enums.NotificationType;
import com.grad.social.model.notification.NotificationDto;
import com.grad.social.repository.notification.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notificationRepository;

    public List<NotificationDto> allNotifications(Long recipientId, int offset) {
        return this.notificationRepository.allNotifications(recipientId, offset);
    }

    public void markAllAsRead(List<Long> unreadNotifications) {
        this.notificationRepository.markAllAsRead(unreadNotifications);
    }

    public void saveNotification(Long actorId, Long[] recipientIds, Long statusId, NotificationType notificationType) {
        this.notificationRepository.saveNotification(actorId, recipientIds, statusId, notificationType);
    }

    public void removeNotification(Long actorId, Long recipientId, Long statusId, NotificationType notificationType) {
        this.notificationRepository.removeNotification(actorId, recipientId, statusId, notificationType);
    }

}