package com.grad.social.service.user;

import com.grad.social.common.AppConstants;
import com.grad.social.common.exceptionhandling.ActionNotAllowedException;
import com.grad.social.common.exceptionhandling.AlreadyRegisteredException;
import com.grad.social.exception.status.StatusErrorCode;
import com.grad.social.model.enums.NotificationType;
import com.grad.social.model.shared.TimestampSeekRequest;
import com.grad.social.model.status.request.ReactToStatusRequest;
import com.grad.social.model.status.response.*;
import com.grad.social.repository.user.UserStatusInteractionRepository;
import com.grad.social.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserStatusInteractionService {
    private final UserStatusInteractionRepository userStatusInteractionRepository;
    private final NotificationService notificationService;

    public StatusWithRepliesResponse getStatusById(Long currentUserId, Long statusId) {
        var status = this.userStatusInteractionRepository.getStatusById(currentUserId, statusId);
        if (status == null) {
            throw new ActionNotAllowedException(StatusErrorCode.NOT_ALLOWED_TO_VIEW_STATUS);
        }
        return status;
    }

    public List<ReplySnippet> fetchMoreReplies(Long currentUserId, Long statusId, TimestampSeekRequest seekRequest) {
        return this.userStatusInteractionRepository.fetchMoreReplies(currentUserId, statusId,
                seekRequest == null ? null : (seekRequest.lastHappenedAt()), seekRequest == null ? null : seekRequest.lastEntityId());
    }

    public FeedResponse fetchUserFeed(Long currentUserId, int offset) {
        List<StatusResponse> statuses = this.userStatusInteractionRepository.fetchFeed(currentUserId, offset);
        var unreadCounts = this.userStatusInteractionRepository.getUnreadCounts(currentUserId);
        return new FeedResponse(statuses, unreadCounts.unreadMessages(), unreadCounts.unreadNotifications());
    }

    public List<StatusResponse> fetchUserPosts(Long currentUserId, Long profileOwnerId, int offset) {
        return this.userStatusInteractionRepository.fetchPosts(currentUserId, profileOwnerId, offset);
    }

    public List<StatusResponse> fetchUserReplies(Long currentUserId, Long profileOwnerId, int offset) {
        return this.userStatusInteractionRepository.fetchReplies(currentUserId, profileOwnerId, offset);
    }

    public List<StatusMediaResponse> fetchUserMedia(Long currentUserId, Long profileOwnerId, int offset) {
        var medias = this.userStatusInteractionRepository.fetchMedia(currentUserId, profileOwnerId, offset);

        // Step 1: remember the original order of statusIds
        Map<Long, Integer> statusOrder = new LinkedHashMap<>();
        for (StatusMediaResponse m : medias) {
            statusOrder.putIfAbsent(m.statusId(), statusOrder.size());
        }

        // Step 2: sort by (statusId original order, position ascending)
        return medias.stream()
                .sorted(Comparator.comparing((StatusMediaResponse m) -> statusOrder.get(m.statusId()))
                        .thenComparing(StatusMediaResponse::position))
                .toList();
    }

    public List<StatusResponse> fetchStatusesLiked(Long currentUserId, int offset) {
        return this.userStatusInteractionRepository.fetchStatusesLiked(currentUserId, offset);
    }

    public void likeStatus(Long currentUserId, ReactToStatusRequest reactToStatusRequest) {
        Long statusId = reactToStatusRequest.statusId();
        int recordsInserted = this.userStatusInteractionRepository.likeStatus(currentUserId, statusId);
        if (recordsInserted == 0) throw new AlreadyRegisteredException(StatusErrorCode.ALREADY_LIKED_STATUS);
        this.notificationService.saveNotification(currentUserId, new Long[]{reactToStatusRequest.statusOwnerId()}, reactToStatusRequest.statusId(), NotificationType.LIKE);
    }

    public void unlikeStatus(Long currentUserId, ReactToStatusRequest reactToStatusRequest) {
        Long statusId = reactToStatusRequest.statusId();
        int recordsDeleted = this.userStatusInteractionRepository.unlikeStatus(currentUserId, statusId);
        if (recordsDeleted == 0) throw new AlreadyRegisteredException(StatusErrorCode.ALREADY_UNLIKED_STATUS);
        this.notificationService.removeNotification(currentUserId, reactToStatusRequest.statusOwnerId(), reactToStatusRequest.statusId(), NotificationType.LIKE);
    }

}