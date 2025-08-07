package com.grad.social.service.user;

import com.grad.grad_proj.generated.api.model.UserAvatarDto;
import com.grad.social.common.exceptionhandling.ActionNotAllowedException;
import com.grad.social.common.exceptionhandling.AlreadyRegisteredException;
import com.grad.social.common.exceptionhandling.AssociationNotFoundException;
import com.grad.social.model.SeekRequest;
import com.grad.social.model.enums.FollowingPriority;
import com.grad.social.repository.user.UserUserInteractionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;

import static com.grad.social.exception.user.UserErrorCode.*;

@Service
@RequiredArgsConstructor
public class UserUserInteractionService {
    private final UserUserInteractionRepository userRepository;

    public List<UserAvatarDto> retrieveFollowerList(Long userId, SeekRequest lastPage) {
        return this.userRepository.findFollowersWithPagination(userId,
                lastPage == null ? null : lastPage.lastHappenedAt(), lastPage == null ? null : lastPage.lastUserId());
    }

    public List<UserAvatarDto> retrieveFollowingList(Long userId, SeekRequest lastPage) {
        return this.userRepository.findFollowingsWithPagination(userId,
                lastPage == null ? null : lastPage.lastHappenedAt(), lastPage == null ? null : lastPage.lastUserId());
    }

    public void followUser(Long userId, Long toFollow) {
        if (Objects.equals(userId, toFollow))
            throw new ActionNotAllowedException(CANNOT_FOLLOW_SELF);
        try {
            this.userRepository.followUser(userId, toFollow);
        } catch (DuplicateKeyException ex) {
            throw new AlreadyRegisteredException(TARGET_ALREADY_FOLLOWED);
        }
    }

    public void unfollowUser(Long userId, Long toUnfollow) {
        if (Objects.equals(userId, toUnfollow))
            throw new ActionNotAllowedException(CANNOT_UNFOLLOW_SELF);
        int recordsDeleted = this.userRepository.unfollowUser(userId, toUnfollow);
        if (recordsDeleted == 0)
            throw new AssociationNotFoundException(TARGET_NOT_FOLLOWED);
    }

    public void updateFollowingPriority(Long userId, long followedUserId, FollowingPriority newPriority) {
        if (Objects.equals(userId, followedUserId))
            throw new ActionNotAllowedException(ACTION_MEANT_FOR_OTHERS_ONLY);
        int recordsUpdated = this.userRepository.updateFollowingPriority(userId, followedUserId, newPriority);
        if (recordsUpdated == 0)
            throw new AssociationNotFoundException(TARGET_NOT_FOLLOWED);
    }


}
