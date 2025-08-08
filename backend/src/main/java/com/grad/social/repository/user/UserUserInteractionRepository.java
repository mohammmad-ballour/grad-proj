package com.grad.social.repository.user;

import com.grad.social.common.AppConstants;
import com.grad.social.common.database.utils.JooqUtils;
import com.grad.social.model.UserSeekResponse;
import com.grad.social.model.enums.FollowingPriority;
import com.grad.social.model.user.MuteDuration;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Repository;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

import static com.grad.social.model.tables.UserBlocks.USER_BLOCKS;
import static com.grad.social.model.tables.UserFollowers.USER_FOLLOWERS;
import static com.grad.social.model.tables.UserMutes.USER_MUTES;
import static com.grad.social.model.tables.Users.USERS;
import static org.jooq.Records.mapping;
import static org.jooq.impl.DSL.row;

@Repository
@RequiredArgsConstructor
public class UserUserInteractionRepository {

    private final DSLContext dsl;

    // user-to-user interactions (userId is the follower)
    public void followUser(Long userId, Long toFollow) throws DuplicateKeyException {
        dsl.insertInto(USER_FOLLOWERS, USER_FOLLOWERS.FOLLOWED_USER_ID, USER_FOLLOWERS.FOLLOWER_ID)
                .values(toFollow, userId)
                .execute();
    }

    public int unfollowUser(Long userId, Long toUnfollow) {
        return JooqUtils.delete(dsl, USER_FOLLOWERS,
                row(USER_FOLLOWERS.FOLLOWED_USER_ID, USER_FOLLOWERS.FOLLOWER_ID).eq(row(toUnfollow, userId)));
    }

    public int updateFollowingPriority(Long userId, long followedUserId, FollowingPriority newPriority) {
        return JooqUtils.update(dsl, USER_FOLLOWERS, Map.of(USER_FOLLOWERS.FOLLOWING_PRIORITY, newPriority),
                row(USER_FOLLOWERS.FOLLOWED_USER_ID, USER_FOLLOWERS.FOLLOWER_ID).eq(row(followedUserId, userId)));
    }

    public List<UserSeekResponse> findFollowersWithPagination(Long userId, LocalDate lastFollowedAt, Long lastFollower) {
        if (lastFollowedAt == null && lastFollower == null) { // this is the first page
            lastFollowedAt = AppConstants.DEFAULT_MAX_DATE;
        }
        return dsl.select(USERS.ID, USERS.DISPLAY_NAME, USERS.PROFILE_PICTURE, USER_FOLLOWERS.FOLLOWED_AT, USERS.PROFILE_BIO)
                .from(USER_FOLLOWERS)
                .join(USERS)
                .on(USER_FOLLOWERS.FOLLOWER_ID.eq(USERS.ID))
                .where(USER_FOLLOWERS.FOLLOWED_USER_ID.eq(userId))
                .orderBy(USER_FOLLOWERS.FOLLOWED_AT.desc(), USER_FOLLOWERS.FOLLOWER_ID.desc())
                .seek(lastFollowedAt, lastFollower) // and (lastFollowedAt, lastFollowerId) < (X, Y)
                .limit(AppConstants.DEFAULT_PAGE_SIZE)
                .fetch(mapping(UserSeekResponse::new));
    }

    public List<UserSeekResponse> findFollowingsWithPagination(Long userId, LocalDate lastFollowedAt, Long lastFollowedUser) {
        if (lastFollowedAt == null && lastFollowedUser == null) { // this is the first page
            lastFollowedAt = AppConstants.DEFAULT_MAX_DATE;
        }
        return dsl.select(USERS.ID, USERS.DISPLAY_NAME, USERS.PROFILE_PICTURE, USER_FOLLOWERS.FOLLOWED_AT, USERS.PROFILE_BIO)
                .from(USER_FOLLOWERS)
                .join(USERS)
                .on(USER_FOLLOWERS.FOLLOWED_USER_ID.eq(USERS.ID))
                .where(USER_FOLLOWERS.FOLLOWER_ID.eq(userId))
                .orderBy(USER_FOLLOWERS.FOLLOWED_AT.desc(), USER_FOLLOWERS.FOLLOWED_USER_ID.desc())
                .seek(lastFollowedAt, lastFollowedUser) // and (lastFollowedAt, lastFollowedUserId) < (X, Y)
                .limit(AppConstants.DEFAULT_PAGE_SIZE)
                .fetch(mapping(UserSeekResponse::new));
    }

    public void muteUser(Long userId, Long toMute, Instant mutedUntil) {
        dsl.insertInto(USER_MUTES, USER_MUTES.USER_ID, USER_MUTES.MUTED_USER_ID, USER_MUTES.MUTED_UNTIL).values(userId, toMute, mutedUntil).execute();
    }

    public int unmuteUser(Long userId, Long toUnmute) {
        return JooqUtils.delete(dsl, USER_MUTES, row(USER_MUTES.USER_ID, USER_MUTES.MUTED_USER_ID).eq(row(userId, toUnmute)));
    }

    public List<UserSeekResponse> findMutedUsersWithPagination(Long userId, Instant lastInstant, Long lastMutedUser) {
        if (lastInstant == null && lastMutedUser == null) { // this is the first page
            lastInstant = Instant.MAX;
        }
        return dsl.select(USERS.ID, USERS.DISPLAY_NAME, USERS.PROFILE_PICTURE, USER_MUTES.MUTED_AT)
                .from(USER_MUTES)
                .join(USERS)
                .on(USER_MUTES.MUTED_USER_ID.eq(USERS.ID))
                .where(USER_MUTES.USER_ID.eq(userId))
                .orderBy(USER_MUTES.MUTED_AT.desc(), USER_MUTES.MUTED_USER_ID.desc())
                .seek(lastInstant, lastMutedUser)
                .limit(AppConstants.DEFAULT_PAGE_SIZE)
                .fetch(mapping((userId1, displayName, profilePicture, actionHappenedAt) -> {
                    var res = new UserSeekResponse();
                    res.setUserId(userId1);
                    res.setDisplayName(displayName);
                    res.setProfilePicture(profilePicture);
                    res.setActionHappenedAt(actionHappenedAt);
                    return res;
                }));
    }

    public void blockUser(Long userId, Long toBlock) {
        dsl.insertInto(USER_BLOCKS, USER_BLOCKS.USER_ID, USER_BLOCKS.BLOCKED_USER_ID).values(userId, toBlock).execute();

        // remove the blocked user from the blocking user follow/mute lists if they exist there
        JooqUtils.delete(dsl, USER_FOLLOWERS, row(USER_FOLLOWERS.FOLLOWED_USER_ID, USER_FOLLOWERS.FOLLOWER_ID).eq(row(userId, toBlock)));
        JooqUtils.delete(dsl, USER_MUTES, row(USER_MUTES.USER_ID, USER_MUTES.MUTED_USER_ID).eq(row(userId, toBlock)));
    }

    public int unblockUser(Long userId, Long toUnblock) {
        return JooqUtils.delete(dsl, USER_BLOCKS, row(USER_BLOCKS.USER_ID, USER_BLOCKS.BLOCKED_USER_ID).eq(row(userId, toUnblock)));
    }

    public List<UserSeekResponse> findBlockedUsersWithPagination(Long userId, LocalDate lastDate, Long lastBlockedUser) {
        if (lastDate == null && lastBlockedUser == null) { // this is the first page
            lastDate = AppConstants.DEFAULT_MAX_DATE;
        }
        return dsl.select(USERS.ID, USERS.DISPLAY_NAME, USERS.PROFILE_PICTURE, USER_BLOCKS.BLOCKED_AT)
                .from(USER_BLOCKS)
                .join(USERS)
                .on(USER_BLOCKS.BLOCKED_USER_ID.eq(USERS.ID))
                .where(USER_BLOCKS.USER_ID.eq(userId))
                .orderBy(USER_BLOCKS.BLOCKED_AT.desc(), USER_BLOCKS.BLOCKED_USER_ID.desc())
                .seek(lastDate, lastBlockedUser)
                .limit(AppConstants.DEFAULT_PAGE_SIZE)
                .fetch(mapping((userId1, displayName, profilePicture, actionHappenedAt) -> {
                    var res = new UserSeekResponse();
                    res.setUserId(userId1);
                    res.setDisplayName(displayName);
                    res.setProfilePicture(profilePicture);
                    res.setActionHappenedAt(actionHappenedAt);
                    return res;
                }));
    }

}
