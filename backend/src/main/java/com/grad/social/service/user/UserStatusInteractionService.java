package com.grad.social.service.user;

import com.grad.social.common.exceptionhandling.ActionNotAllowedException;
import com.grad.social.common.exceptionhandling.AlreadyRegisteredException;
import com.grad.social.exception.status.StatusErrorCode;
import com.grad.social.model.shared.TimestampSeekRequest;
import com.grad.social.model.status.request.ReactToStatusRequest;
import com.grad.social.model.status.response.ReplySnippet;
import com.grad.social.model.status.response.StatusMediaResponse;
import com.grad.social.model.status.response.StatusResponse;
import com.grad.social.model.status.response.StatusWithRepliesResponse;
import com.grad.social.repository.user.UserStatusInteractionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserStatusInteractionService {
    private final UserStatusInteractionRepository userStatusInteractionRepository;

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

    public List<StatusResponse> fetchUserFeed(Long currentUserId, TimestampSeekRequest seekRequest) {
        return this.userStatusInteractionRepository.fetchFeed(currentUserId,
                seekRequest == null ? null : seekRequest.lastHappenedAt(), seekRequest == null ? null : seekRequest.lastEntityId());
    }

    public List<StatusResponse> fetchUserPosts(Long currentUserId, Long profileOwnerId, TimestampSeekRequest seekRequest) {
        return this.userStatusInteractionRepository.fetchPosts(currentUserId, profileOwnerId,
                seekRequest == null ? null : seekRequest.lastHappenedAt(), seekRequest == null ? null : seekRequest.lastEntityId());
    }

    public List<StatusResponse> fetchUserReplies(Long currentUserId, Long profileOwnerId, TimestampSeekRequest seekRequest) {
        return this.userStatusInteractionRepository.fetchReplies(currentUserId, profileOwnerId,
                seekRequest == null ? null : seekRequest.lastHappenedAt(), seekRequest == null ? null : seekRequest.lastEntityId());
    }

    public List<StatusMediaResponse> fetchUserMedia(Long currentUserId, Long profileOwnerId, TimestampSeekRequest seekRequest) {
        return this.userStatusInteractionRepository.fetchMedia(currentUserId, profileOwnerId,
                seekRequest == null ? null : seekRequest.lastHappenedAt(), seekRequest == null ? null : seekRequest.lastEntityId());
    }

    public List<StatusResponse> fetchStatusesLiked(Long currentUserId, TimestampSeekRequest seekRequest) {
        return this.userStatusInteractionRepository.fetchStatusesLiked(currentUserId,
                seekRequest == null ? null : seekRequest.lastHappenedAt(), seekRequest == null ? null : seekRequest.lastEntityId());
    }

    public void likeStatus(Long currentUserId, ReactToStatusRequest reactToStatusRequest) {
        Long statusId = reactToStatusRequest.statusId();
        int recordsInserted = this.userStatusInteractionRepository.likeStatus(currentUserId, statusId);
        if (recordsInserted == 0) throw new AlreadyRegisteredException(StatusErrorCode.ALREADY_LIKED_STATUS);
    }

    public void unlikeStatus(Long currentUserId, ReactToStatusRequest reactToStatusRequest) {
        Long statusId = reactToStatusRequest.statusId();
        int recordsDeleted = this.userStatusInteractionRepository.unlikeStatus(currentUserId, statusId);
        if (recordsDeleted == 0) throw new AlreadyRegisteredException(StatusErrorCode.ALREADY_UNLIKED_STATUS);
    }

}