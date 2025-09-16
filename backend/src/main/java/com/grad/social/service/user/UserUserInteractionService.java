package com.grad.social.service.user;

import com.grad.social.common.AppConstants;
import com.grad.social.common.exceptionhandling.ActionNotAllowedException;
import com.grad.social.common.exceptionhandling.AlreadyRegisteredException;
import com.grad.social.common.exceptionhandling.AssociationNotFoundException;
import com.grad.social.common.utils.TemporalUtils;
import com.grad.social.model.enums.FollowingPriority;
import com.grad.social.model.user.request.MuteDuration;
import com.grad.social.model.user.response.UserResponse;
import com.grad.social.repository.user.UserUserInteractionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Objects;

import static com.grad.social.exception.user.UserErrorCode.*;

@Service
@RequiredArgsConstructor
public class UserUserInteractionService {
    private final UserUserInteractionRepository userRepository;

    public List<UserResponse> retrieveFollowerList(Long userId, Long currentUserId, int page) {
        return this.userRepository.findFollowersWithPagination(userId, currentUserId, page);
    }

    public List<UserResponse> retrieveFollowingList(Long userId, Long currentUserId, int page) {
        return this.userRepository.findFollowingsWithPagination(userId, currentUserId, page);
    }

    public List<UserResponse> findFollowersCurrentUserFollowsInUserIdFollowingList(Long userId, Long currentUserId, int page) {
        return this.userRepository.findFollowersCurrentUserFollowsInUserIdFollowingList(userId, currentUserId, page);
    }

    public void followUser(Long userId, Long toFollow) {
        if (Objects.equals(userId, toFollow)) {
            throw new ActionNotAllowedException(CANNOT_FOLLOW_SELF);
        }
        try {
            this.userRepository.followUser(userId, toFollow);
        } catch (DuplicateKeyException ex) {
            throw new AlreadyRegisteredException(TARGET_ALREADY_FOLLOWED);
        }
    }

    public void unfollowUser(Long userId, Long toUnfollow) {
        if (Objects.equals(userId, toUnfollow)) {
            throw new ActionNotAllowedException(CANNOT_UNFOLLOW_SELF);
        }
        int recordsDeleted = this.userRepository.unfollowUser(userId, toUnfollow);
        if (recordsDeleted == 0) {
            throw new AssociationNotFoundException(TARGET_NOT_FOLLOWED);
        }
    }

    public void updateFollowingPriority(Long userId, long followedUserId, FollowingPriority newPriority) {
        if (Objects.equals(userId, followedUserId)) {
            throw new ActionNotAllowedException(ACTION_MEANT_FOR_OTHERS_ONLY);
        }
        int recordsUpdated = this.userRepository.updateFollowingPriority(userId, followedUserId, newPriority);
        if (recordsUpdated == 0)
            throw new AssociationNotFoundException(TARGET_NOT_FOLLOWED);
    }

    public void muteUser(Long userId, Long toMute, MuteDuration muteDuration) {
        if (Objects.equals(userId, toMute)) {
            throw new ActionNotAllowedException(CANNOT_MUTE_SELF);
        }
        Instant mutedUntil = Instant.now();
        if (muteDuration.unit().equals("FOREVER")) {
            mutedUntil = AppConstants.DEFAULT_MAX_TIMESTAMP;
        } else {
            ChronoUnit unit = ChronoUnit.valueOf(muteDuration.unit().toUpperCase());
            int amount = muteDuration.amount();
            if (unit.isDateBased()) {
                switch (unit) {
                    case DAYS -> mutedUntil = TemporalUtils.addDays(mutedUntil, amount);
                    case MONTHS -> mutedUntil = TemporalUtils.addMonths(mutedUntil, amount);
                    case YEARS -> mutedUntil = TemporalUtils.addYears(mutedUntil, amount);
                    default -> throw new IllegalArgumentException("Unsupported date unit: " + unit);
                }
            } else {
                mutedUntil = TemporalUtils.addHours(mutedUntil, amount);
            }

        }
        try {
            this.userRepository.muteUser(userId, toMute, mutedUntil);
        } catch (DuplicateKeyException ex) {
            throw new AlreadyRegisteredException(TARGET_ALREADY_MUTED);
        }
    }

    public void unmuteUser(Long userId, Long toUnmute) {
        if (Objects.equals(userId, toUnmute)) {
            throw new ActionNotAllowedException(CANNOT_UNMUTE_SELF);
        }
        int recordsDeleted = this.userRepository.unmuteUser(userId, toUnmute);
        if (recordsDeleted == 0) {
            throw new AssociationNotFoundException(TARGET_NOT_BLOCKED);
        }
    }

    public List<UserResponse> findMutedUsersWithPagination(Long userId, int page) {
        return this.userRepository.findMutedUsersWithPagination(userId, page);
    }

    public void blockUser(Long userId, Long toBlock) {
        if (Objects.equals(userId, toBlock)) {
            throw new ActionNotAllowedException(CANNOT_UNMUTE_SELF);
        }
        try {
            this.userRepository.blockUser(userId, toBlock);
        } catch (DuplicateKeyException ex) {
            throw new AlreadyRegisteredException(TARGET_ALREADY_BLOCKED);
        }
    }

    public void unblockUser(Long userId, Long toUnblock) {
        if (Objects.equals(userId, toUnblock)) {
            throw new ActionNotAllowedException(CANNOT_UNMUTE_SELF);
        }
        int recordsDeleted = this.userRepository.unblockUser(userId, toUnblock);
        if (recordsDeleted == 0) {
            throw new AssociationNotFoundException(TARGET_NOT_BLOCKED);
        }
    }

    public List<UserResponse> findBlockedUsersWithPagination(Long userId, int page) {
        return this.userRepository.findBlockedUsersWithPagination(userId, page);
    }


}
