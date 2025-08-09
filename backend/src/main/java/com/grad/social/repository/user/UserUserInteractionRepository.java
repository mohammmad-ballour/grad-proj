package com.grad.social.repository.user;

import com.grad.social.common.AppConstants;
import com.grad.social.common.database.utils.JooqUtils;
import com.grad.social.common.utils.TemporalUtils;
import com.grad.social.model.UserSeekResponse;
import com.grad.social.model.enums.FollowingPriority;
import com.grad.social.model.tables.UserBlocks;
import com.grad.social.model.tables.UserFollowers;
import com.grad.social.model.tables.UserMutes;
import com.grad.social.model.tables.Users;
import com.grad.social.model.user.FollowerType;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.jooq.Field;
import org.jooq.impl.DSL;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;

import static org.jooq.Records.mapping;
import static org.jooq.impl.DSL.row;

@Repository
@RequiredArgsConstructor
public class UserUserInteractionRepository {

    private final DSLContext dsl;
    private final Users u = Users.USERS.as("u");
    private final UserBlocks ub = UserBlocks.USER_BLOCKS.as("ub");
    private final UserMutes um = UserMutes.USER_MUTES.as("UM");
    private final UserFollowers uf1 = UserFollowers.USER_FOLLOWERS.as("uf1");
    private final UserFollowers uf2 = UserFollowers.USER_FOLLOWERS.as("uf2");

    // user-to-user interactions (userId is the follower)
    public void followUser(Long userId, Long toFollow) throws DuplicateKeyException {
        dsl.insertInto(uf1, uf1.FOLLOWED_USER_ID, uf1.FOLLOWER_ID)
                .values(toFollow, userId)
                .execute();
    }

    public int unfollowUser(Long userId, Long toUnfollow) {
        return JooqUtils.delete(dsl, uf1,
                row(uf1.FOLLOWED_USER_ID, uf1.FOLLOWER_ID).eq(row(toUnfollow, userId)));
    }

    public int updateFollowingPriority(Long userId, long followedUserId, FollowingPriority newPriority) {
        return JooqUtils.update(dsl, uf1, Map.of(uf1.FOLLOWING_PRIORITY, newPriority),
                row(uf1.FOLLOWED_USER_ID, uf1.FOLLOWER_ID).eq(row(followedUserId, userId)));
    }

    // currentUserId is -1 if anonymous
    public Map<FollowerType, List<UserSeekResponse>> findFollowersWithPagination(Long userId, Long currentUserId, LocalDate lastFollowedAt, Long lastFollower) {
        if (lastFollowedAt == null && lastFollower == null) { // this is the first page
            lastFollowedAt = AppConstants.DEFAULT_MAX_DATE;
        }

        Field<Boolean> isFollowedByCurrentUserField = DSL
                .when(uf2.FOLLOWED_USER_ID.isNotNull(), DSL.trueCondition())
                .otherwise(DSL.falseCondition())
                .as("is_followed_by_current_user");

        List<UserSeekResponse> followedByCurrentUser = new ArrayList<>();
        List<UserSeekResponse> unfollowedByCurrentUser = new ArrayList<>();
        // add a verified users list later

        var allFollowers = dsl.select(uf1.FOLLOWER_ID, u.DISPLAY_NAME, u.PROFILE_PICTURE, uf1.FOLLOWED_AT, u.PROFILE_BIO, isFollowedByCurrentUserField)
                .from(u)
                .join(uf1).on(uf1.FOLLOWED_USER_ID.eq(u.ID))
                .leftJoin(uf2).on((uf2.FOLLOWED_USER_ID.eq(uf1.FOLLOWER_ID)).and(uf2.FOLLOWER_ID.eq(currentUserId)))
                .where(uf1.FOLLOWED_USER_ID.eq(userId).and(uf1.FOLLOWER_ID.ne(currentUserId))
                        .andNotExists(
                                dsl.selectOne()
                                        .from(ub)
                                        .where(ub.USER_ID.eq(currentUserId).and(ub.BLOCKED_USER_ID.eq(uf1.FOLLOWER_ID)))
                        ))
                .orderBy(uf1.FOLLOWED_AT.desc(), uf1.FOLLOWER_ID.desc())
                .seek(lastFollowedAt, lastFollower) // and (lastFollowedAt, lastFollowerId) < (X, Y)
                .limit(AppConstants.DEFAULT_PAGE_SIZE)
                .fetch(mapping((uid, displayName, profilePicture, actionHappenedAt, profileBio, isFollowedByCurrentUser) -> {
                    var res = new UserSeekResponse();
                    res.setUserId(uid);
                    res.setDisplayName(displayName);
                    res.setProfilePicture(profilePicture);
                    res.setActionHappenedAt(TemporalUtils.localDateToInstant(actionHappenedAt));
                    res.setProfileBio(profileBio);
                    if (isFollowedByCurrentUser) {
                        followedByCurrentUser.add(res);
                    } else {
                        unfollowedByCurrentUser.add(res);
                    }
                    return res;
                }));

//        var followersCurrentUserFollows = findFollowersCurrentUserFollows(userId, currentUserId, lastFollowedAt, lastFollower);
        Map<FollowerType, List<UserSeekResponse>> resultMap = new HashMap<>();
//        partitionedByIsMutualFollowing.put(FollowerType.YOU_FOLLOW, followersCurrentUserFollows);
//        var otherFollowers = allFollowers.stream().filter(e -> !followersCurrentUserFollows.contains(e)).toList();
//        partitionedByIsMutualFollowing.put(FollowerType.NORMAL, otherFollowers);

        resultMap.put(FollowerType.YOU_FOLLOW, followedByCurrentUser);
        resultMap.put(FollowerType.NORMAL, unfollowedByCurrentUser);
        return resultMap;

    }

    public Map<Boolean, List<UserSeekResponse>> findFollowingsWithPagination(Long userId, Long currentUserId, LocalDate lastFollowedAt, Long lastFollowedUser) {
        if (lastFollowedAt == null && lastFollowedUser == null) { // this is the first page
            lastFollowedAt = AppConstants.DEFAULT_MAX_DATE;
        }

        Field<Boolean> isFollowedByCurrentUserField = DSL
                .when(uf2.FOLLOWER_ID.isNotNull(), DSL.trueCondition())
                .otherwise(DSL.falseCondition())
                .as("is_followed_by_current_user");

        List<UserSeekResponse> followed = new ArrayList<>();
        List<UserSeekResponse> unfollowed = new ArrayList<>();
        var response = dsl.select(u.ID, u.DISPLAY_NAME, u.PROFILE_PICTURE, uf1.FOLLOWED_AT, u.PROFILE_BIO, isFollowedByCurrentUserField)
                .from(uf1)
                .join(u).on(uf1.FOLLOWED_USER_ID.eq(u.ID))
                .leftJoin(uf2).on((uf2.FOLLOWED_USER_ID.eq(u.ID)).and(uf2.FOLLOWER_ID.eq(currentUserId)))
                .where(uf1.FOLLOWER_ID.eq(userId).and(uf1.FOLLOWED_USER_ID.ne(currentUserId))
                        .andNotExists(
                                dsl.selectOne()
                                        .from(ub)
                                        .where(ub.USER_ID.eq(currentUserId).and(ub.BLOCKED_USER_ID.eq(u.ID)))
                        ))
                .orderBy(uf1.FOLLOWED_AT.desc(), uf1.FOLLOWED_USER_ID.desc())
                .seek(lastFollowedAt, lastFollowedUser) // and (lastFollowedAt, lastFollowedUserId) < (X, Y)
                .limit(AppConstants.DEFAULT_PAGE_SIZE)
                .fetch(mapping((uid, displayName, profilePicture, actionHappenedAt, profileBio, isFollowedByCurrentUser) -> {
                    var res = new UserSeekResponse();
                    res.setUserId(uid);
                    res.setDisplayName(displayName);
                    res.setProfilePicture(profilePicture);
                    res.setActionHappenedAt(TemporalUtils.localDateToInstant(actionHappenedAt));
                    res.setProfileBio(profileBio);
                    if (isFollowedByCurrentUser) {
                        followed.add(res);
                    } else {
                        unfollowed.add(res);
                    }
                    return res;
                }));

        Map<Boolean, List<UserSeekResponse>> resultMap = new HashMap<>();
        resultMap.put(true, followed);
        resultMap.put(false, unfollowed);
        return resultMap;
    }

    // followings of userId (profile owner) that the current user (you) is following
    public List<UserSeekResponse> findFollowersCurrentUserFollowsInUserIdFollowingList(Long userId, Long currentUserId, LocalDate lastFollowedAt, Long lastFollower) {
        if (lastFollowedAt == null && lastFollower == null) { // this is the first page
            lastFollowedAt = AppConstants.DEFAULT_MAX_DATE;
        }

        return dsl.select(u.ID, u.DISPLAY_NAME, u.PROFILE_PICTURE, uf1.FOLLOWED_AT, u.PROFILE_BIO)
                .from(u)
                .join(uf1).on(u.ID.eq(uf1.FOLLOWED_USER_ID))
                .leftJoin(uf2).on((uf2.FOLLOWED_USER_ID.eq(u.ID)).and(uf2.FOLLOWER_ID.eq(currentUserId)))
                .where(uf1.FOLLOWER_ID.eq(userId).and(uf1.FOLLOWED_USER_ID.ne(currentUserId)).and(uf2.FOLLOWER_ID.isNotNull())
                        .andNotExists(
                                dsl.selectOne()
                                        .from(ub)
                                        .where(ub.USER_ID.eq(currentUserId).and(ub.BLOCKED_USER_ID.eq(u.ID)))
                                        ))
                .orderBy(uf1.FOLLOWED_AT.desc(), uf1.FOLLOWER_ID.desc())
                .seek(lastFollowedAt, lastFollower) // and (lastFollowedAt, lastFollowerId) < (X, Y)
                .limit(AppConstants.DEFAULT_PAGE_SIZE)
                .fetch(mapping((uid, displayName, profilePicture, actionHappenedAt, profileBio) -> {
                    var res = new UserSeekResponse();
                    res.setUserId(uid);
                    res.setDisplayName(displayName);
                    res.setProfilePicture(profilePicture);
                    res.setActionHappenedAt(TemporalUtils.localDateToInstant(actionHappenedAt));
                    res.setProfileBio(profileBio);
                    return res;
                }));
    }

    public void muteUser(Long userId, Long toMute, Instant mutedUntil) {
        dsl.insertInto(um, um.USER_ID, um.MUTED_USER_ID, um.MUTED_UNTIL).values(userId, toMute, mutedUntil)
                .onConflict(um.USER_ID, um.MUTED_USER_ID) // PK columns
                .doUpdate()
                .set(um.MUTED_UNTIL, mutedUntil)
                .execute();
    }

    public int unmuteUser(Long userId, Long toUnmute) {
        return JooqUtils.delete(dsl, um, row(um.USER_ID, um.MUTED_USER_ID).eq(row(userId, toUnmute)));
    }

    public List<UserSeekResponse> findMutedUsersWithPagination(Long userId, Instant lastInstant, Long lastMutedUser) {
        if (lastInstant == null && lastMutedUser == null) { // this is the first page
            lastInstant = Instant.MAX;
        }
        return dsl.select(u.ID, u.DISPLAY_NAME, u.PROFILE_PICTURE, um.MUTED_AT)
                .from(um)
                .join(u)
                .on(um.MUTED_USER_ID.eq(u.ID))
                .where(um.USER_ID.eq(userId))
                .orderBy(um.MUTED_AT.desc(), um.MUTED_USER_ID.desc())
                .seek(lastInstant, lastMutedUser)
                .limit(AppConstants.DEFAULT_PAGE_SIZE)
                .fetch(mapping((uid, displayName, profilePicture, actionHappenedAt) -> {
                    var res = new UserSeekResponse();
                    res.setUserId(uid);
                    res.setDisplayName(displayName);
                    res.setProfilePicture(profilePicture);
                    res.setActionHappenedAt(actionHappenedAt);
                    return res;
                }));
    }

    public void blockUser(Long userId, Long toBlock) {
        dsl.insertInto(ub, ub.USER_ID, ub.BLOCKED_USER_ID).values(userId, toBlock).execute();

        // remove the blocked user from the blocking user follow/mute lists if they exist there
        JooqUtils.delete(dsl, uf1, row(uf1.FOLLOWED_USER_ID, uf1.FOLLOWER_ID).eq(row(userId, toBlock)));
        JooqUtils.delete(dsl, um, row(um.USER_ID, um.MUTED_USER_ID).eq(row(userId, toBlock)));
    }

    public int unblockUser(Long userId, Long toUnblock) {
        return JooqUtils.delete(dsl, ub, row(ub.USER_ID, ub.BLOCKED_USER_ID).eq(row(userId, toUnblock)));
    }

    public List<UserSeekResponse> findBlockedUsersWithPagination(Long userId, LocalDate lastDate, Long lastBlockedUser) {
        if (lastDate == null && lastBlockedUser == null) { // this is the first page
            lastDate = AppConstants.DEFAULT_MAX_DATE;
        }
        return dsl.select(u.ID, u.DISPLAY_NAME, u.PROFILE_PICTURE, ub.BLOCKED_AT)
                .from(ub)
                .join(u)
                .on(ub.BLOCKED_USER_ID.eq(u.ID))
                .where(ub.USER_ID.eq(userId))
                .orderBy(ub.BLOCKED_AT.desc(), ub.BLOCKED_USER_ID.desc())
                .seek(lastDate, lastBlockedUser)
                .limit(AppConstants.DEFAULT_PAGE_SIZE)
                .fetch(mapping((uid, displayName, profilePicture, actionHappenedAt) -> {
                    var res = new UserSeekResponse();
                    res.setUserId(uid);
                    res.setDisplayName(displayName);
                    res.setProfilePicture(profilePicture);
                    res.setActionHappenedAt(actionHappenedAt.atStartOfDay().toInstant(ZoneOffset.UTC));
                    return res;
                }));
    }

}
