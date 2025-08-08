package com.grad.social.service.user;

import com.grad.social.common.AppConstants;
import com.grad.social.common.exceptionhandling.ActionNotAllowedException;
import com.grad.social.common.exceptionhandling.AlreadyRegisteredException;
import com.grad.social.common.exceptionhandling.AssociationNotFoundException;
import com.grad.social.common.utils.TemporalUtils;
import com.grad.social.model.SeekRequest;
import com.grad.social.model.UserSeekResponse;
import com.grad.social.model.enums.FollowingPriority;
import com.grad.social.model.user.MuteDuration;
import com.grad.social.repository.user.UserUserInteractionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.Period;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Objects;

import static com.grad.social.exception.user.UserErrorCode.*;
import static java.time.ZoneOffset.UTC;

@Service
@RequiredArgsConstructor
public class UserUserInteractionService {
    private final UserUserInteractionRepository userRepository;

    public List<UserSeekResponse> retrieveFollowerList(Long userId, SeekRequest lastPage) {
        return this.userRepository.findFollowersWithPagination(userId,
                lastPage == null ? null : lastPage.lastHappenedAt().atZone(UTC).toLocalDate(), lastPage == null ? null : lastPage.lastEntityId());
    }

    public List<UserSeekResponse> retrieveFollowingList(Long userId, SeekRequest lastPage) {
        return this.userRepository.findFollowingsWithPagination(userId,
                lastPage == null ? null : lastPage.lastHappenedAt().atZone(UTC).toLocalDate(), lastPage == null ? null : lastPage.lastEntityId());
    }

    public List<UserSeekResponse> findMutualFollowings(Long userId, Long currentUserId, SeekRequest lastPage) {
        return this.userRepository.findMutualFollowings(userId, currentUserId,
                lastPage == null ? null : lastPage.lastHappenedAt().atZone(UTC).toLocalDate(), lastPage == null ? null : lastPage.lastEntityId());
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

    public List<UserSeekResponse> findMutedUsersWithPagination(Long userId, SeekRequest lastPage) {
        return this.userRepository.findMutedUsersWithPagination(userId,
                lastPage == null ? null : (Instant) lastPage.lastHappenedAt(), lastPage == null ? null : lastPage.lastEntityId());
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

    public List<UserSeekResponse> findBlockedUsersWithPagination(Long userId, SeekRequest lastPage) {
        return this.userRepository.findBlockedUsersWithPagination(userId,
                lastPage == null ? null : lastPage.lastHappenedAt().atZone(UTC).toLocalDate(), lastPage == null ? null : lastPage.lastEntityId());
    }


}
