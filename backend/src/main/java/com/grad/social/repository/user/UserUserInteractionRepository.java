package com.grad.social.repository.user;

import com.grad.social.common.AppConstants;
import com.grad.social.common.database.utils.JooqUtils;
import com.grad.social.common.utils.TemporalUtils;
import com.grad.social.model.enums.FollowingPriority;
import com.grad.social.model.shared.ProfileStatus;
import com.grad.social.model.tables.UserBlocks;
import com.grad.social.model.tables.UserFollowers;
import com.grad.social.model.tables.UserMutes;
import com.grad.social.model.tables.Users;
import com.grad.social.model.user.response.UserSeekResponse;
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
import java.util.Map;

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
    public List<UserSeekResponse> findFollowersWithPagination(Long userId, Long currentUserId, LocalDate lastFollowedAt, Long lastFollower) {
        if (lastFollowedAt == null && lastFollower == null) { // this is the first page
            lastFollowedAt = AppConstants.DEFAULT_MAX_DATE;
        }

        Field<Boolean> isFollowedByCurrentUserField = DSL
                .when(uf2.FOLLOWED_USER_ID.isNotNull(), DSL.trueCondition())
                .otherwise(DSL.falseCondition())
                .as("is_followed_by_current_user");

        return dsl.select(uf1.FOLLOWER_ID, u.DISPLAY_NAME, u.PROFILE_PICTURE, uf1.FOLLOWED_AT, u.PROFILE_BIO, u.IS_VERIFIED, isFollowedByCurrentUserField)
                .from(u)
                .join(uf1).on(uf1.FOLLOWER_ID.eq(u.ID))
                .leftJoin(uf2).on((uf2.FOLLOWED_USER_ID.eq(uf1.FOLLOWER_ID)).and(uf2.FOLLOWER_ID.eq(currentUserId)))
                .where(uf1.FOLLOWED_USER_ID.eq(userId).and(uf1.FOLLOWER_ID.ne(currentUserId))
                        .andNotExists(
                                dsl.selectOne()
                                        .from(ub)
                                        .where(
                                                (ub.USER_ID.eq(currentUserId).and(ub.BLOCKED_USER_ID.eq(uf1.FOLLOWER_ID))).or
                                                        (ub.USER_ID.eq(uf1.FOLLOWER_ID).and(ub.BLOCKED_USER_ID.eq(currentUserId)))
                                        )
                        ))
                .orderBy(uf1.FOLLOWED_AT.desc(), uf1.FOLLOWER_ID.desc())
                .seek(lastFollowedAt, lastFollower) // and (lastFollowedAt, lastFollowerId) < (X, Y)
                .limit(AppConstants.DEFAULT_PAGE_SIZE)
                .fetch(mapping((uid, displayName, profilePicture, actionHappenedAt, profileBio, isVerified, isFollowedByCurrentUser) -> {
                    var res = new UserSeekResponse();
                    res.setUserId(uid);
                    res.setDisplayName(displayName);
                    res.setProfilePicture(profilePicture);
                    res.setActionHappenedAt(TemporalUtils.localDateToInstant(actionHappenedAt));
                    res.setProfileBio(profileBio);
                    res.setVerified(isVerified);
                    res.setFollowedByCurrentUser(isFollowedByCurrentUser);
                    return res;
                }));
    }

    public List<UserSeekResponse> findFollowingsWithPagination(Long userId, Long currentUserId, LocalDate lastFollowedAt, Long lastFollowedUser) {
        if (lastFollowedAt == null && lastFollowedUser == null) { // this is the first page
            lastFollowedAt = AppConstants.DEFAULT_MAX_DATE;
        }

        Field<Boolean> isFollowedByCurrentUserField = DSL
                .when(uf2.FOLLOWER_ID.isNotNull(), DSL.trueCondition())
                .otherwise(DSL.falseCondition())
                .as("is_followed_by_current_user");

        return dsl.select(u.ID, u.DISPLAY_NAME, u.PROFILE_PICTURE, uf1.FOLLOWED_AT, u.PROFILE_BIO, u.IS_VERIFIED, isFollowedByCurrentUserField)
                .from(u)
                .join(uf1).on(uf1.FOLLOWED_USER_ID.eq(u.ID))
                .leftJoin(uf2).on((uf2.FOLLOWED_USER_ID.eq(u.ID)).and(uf2.FOLLOWER_ID.eq(currentUserId)))
                .where(uf1.FOLLOWER_ID.eq(userId).and(uf1.FOLLOWED_USER_ID.ne(currentUserId))
                        .andNotExists(
                                dsl.selectOne()
                                        .from(ub)
                                        .where(
                                                (ub.USER_ID.eq(currentUserId).and(ub.BLOCKED_USER_ID.eq(u.ID))).or
                                                        (ub.USER_ID.eq(u.ID).and(ub.BLOCKED_USER_ID.eq(currentUserId)))
                                        )
                        ))
                .orderBy(uf1.FOLLOWED_AT.desc(), uf1.FOLLOWED_USER_ID.desc())
                .seek(lastFollowedAt, lastFollowedUser) // and (lastFollowedAt, lastFollowedUserId) < (X, Y)
                .limit(AppConstants.DEFAULT_PAGE_SIZE)
                .fetch(mapping((uid, displayName, profilePicture, actionHappenedAt, profileBio, isVerified, isFollowedByCurrentUser) -> {
                    var res = new UserSeekResponse();
                    res.setUserId(uid);
                    res.setDisplayName(displayName);
                    res.setProfilePicture(profilePicture);
                    res.setActionHappenedAt(TemporalUtils.localDateToInstant(actionHappenedAt));
                    res.setProfileBio(profileBio);
                    res.setVerified(isVerified);
                    res.setFollowedByCurrentUser(isFollowedByCurrentUser);
                    return res;
                }));
    }

    // followings of userId (profile owner) that the current user (you) is following
    public List<UserSeekResponse> findFollowersCurrentUserFollowsInUserIdFollowingList(Long userId, Long currentUserId, LocalDate lastFollowedAt, Long lastFollower) {
        if (lastFollowedAt == null && lastFollower == null) { // this is the first page
            lastFollowedAt = AppConstants.DEFAULT_MAX_DATE;
        }

        return dsl.select(u.ID, u.DISPLAY_NAME, u.PROFILE_PICTURE, uf1.FOLLOWED_AT, u.PROFILE_BIO, u.IS_VERIFIED)
                .from(u)
                .join(uf1).on(u.ID.eq(uf1.FOLLOWED_USER_ID))
                .leftJoin(uf2).on((uf2.FOLLOWED_USER_ID.eq(u.ID)).and(uf2.FOLLOWER_ID.eq(currentUserId)))
                .where(uf1.FOLLOWER_ID.eq(userId).and(uf1.FOLLOWED_USER_ID.ne(currentUserId)).and(uf2.FOLLOWER_ID.isNotNull())
                        .andNotExists(
                                dsl.selectOne()
                                        .from(ub)
                                        .where(
                                                (ub.USER_ID.eq(currentUserId).and(ub.BLOCKED_USER_ID.eq(u.ID))).or
                                                        (ub.USER_ID.eq(u.ID).and(ub.BLOCKED_USER_ID.eq(currentUserId)))
                                        )))
                .orderBy(uf1.FOLLOWED_AT.desc(), uf1.FOLLOWER_ID.desc())
                .seek(lastFollowedAt, lastFollower) // and (lastFollowedAt, lastFollowerId) < (X, Y)
                .limit(AppConstants.DEFAULT_PAGE_SIZE)
                .fetch(mapping((uid, displayName, profilePicture, actionHappenedAt, profileBio, isVerified) -> {
                    var res = new UserSeekResponse();
                    res.setUserId(uid);
                    res.setDisplayName(displayName);
                    res.setProfilePicture(profilePicture);
                    res.setActionHappenedAt(TemporalUtils.localDateToInstant(actionHappenedAt));
                    res.setProfileBio(profileBio);
                    res.setVerified(isVerified);
                    return res;
                }));
    }

    public void muteUser(Long userId, Long toMute, Instant mutedUntil) {
        dsl.insertInto(um, um.USER_ID, um.MUTED_USER_ID, um.MUTED_UNTIL).values(userId, toMute, mutedUntil)
                .onConflict(um.USER_ID, um.MUTED_USER_ID) // PK columns
                .doUpdate()
                .set(um.MUTED_AT, Instant.now())
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
        return dsl.select(u.ID, u.DISPLAY_NAME, u.PROFILE_PICTURE, ub.BLOCKED_AT, u.IS_VERIFIED)
                .from(ub)
                .join(u)
                .on(ub.BLOCKED_USER_ID.eq(u.ID))
                .where(ub.USER_ID.eq(userId))
                .orderBy(ub.BLOCKED_AT.desc(), ub.BLOCKED_USER_ID.desc())
                .seek(lastDate, lastBlockedUser)
                .limit(AppConstants.DEFAULT_PAGE_SIZE)
                .fetch(mapping((uid, displayName, profilePicture, actionHappenedAt, isVerified) -> {
                    var res = new UserSeekResponse();
                    res.setUserId(uid);
                    res.setDisplayName(displayName);
                    res.setProfilePicture(profilePicture);
                    res.setActionHappenedAt(actionHappenedAt.atStartOfDay().toInstant(ZoneOffset.UTC));
                    res.setVerified(isVerified);
                    return res;
                }));
    }

    // Utils
    public ProfileStatus getProfileStatus(Long profileOwnerId, Long currentUserId) {
        if (profileOwnerId.equals(currentUserId)) {
            return new ProfileStatus(false, false, false);
        }
        return dsl
                .select(
                        DSL.exists(
                                dsl.selectOne()
                                        .from(ub)
                                        .where(ub.USER_ID.eq(currentUserId)
                                                .and(ub.BLOCKED_USER_ID.eq(profileOwnerId)))
                        ).as("is_blocked"),
                        DSL.exists(
                                dsl.selectOne()
                                        .from(uf1)
                                        .where(uf1.FOLLOWER_ID.eq(currentUserId)
                                                .and(uf1.FOLLOWED_USER_ID.eq(profileOwnerId)))
                        ).as("is_followed"),
                        u.IS_PROTECTED.as("is_protected")
                )
                .from(u)
                .where(u.ID.eq(profileOwnerId))
                .fetchOneInto(ProfileStatus.class);
    }

}
