package com.grad.social.service.user;

import com.grad.social.common.exceptionhandling.ActionNotAllowedException;
import com.grad.social.exception.status.StatusErrorCode;
import com.grad.social.model.status.response.StatusWithRepliesResponse;
import com.grad.social.repository.user.UserStatusInteractionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

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

}