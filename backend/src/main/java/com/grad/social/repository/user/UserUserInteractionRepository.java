package com.grad.social.repository.user;

import com.grad.grad_proj.generated.api.model.UserAvatarDto;
import com.grad.social.common.AppConstants;
import com.grad.social.common.database.utils.JooqUtils;
import com.grad.social.model.enums.FollowingPriority;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static com.grad.social.model.tables.UserFollowers.USER_FOLLOWERS;
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


    public List<UserAvatarDto> findFollowersWithPagination(Long userId, LocalDate lastFollowedAt, Long lastFollower) {
        if (lastFollowedAt == null && lastFollower == null) { // this is the first page
            lastFollowedAt = AppConstants.DEFAULT_MAX_DATE;
        }
        return dsl.select(USERS.ID, USERS.USERNAME, USERS.PROFILE_PICTURE)
                .from(USER_FOLLOWERS)
                .join(USERS)
                .on(USER_FOLLOWERS.FOLLOWER_ID.eq(USERS.ID))
                .where(USER_FOLLOWERS.FOLLOWED_USER_ID.eq(userId))
                .orderBy(USER_FOLLOWERS.FOLLOWED_AT.desc(), USER_FOLLOWERS.FOLLOWER_ID.desc())
                .seek(lastFollowedAt, lastFollower) // and (lastFollowedAt, lastFollowerId) < (X, Y)
                .limit(AppConstants.DEFAULT_PAGE_SIZE)
                .fetch(mapping(UserAvatarDto::new));
    }

    public List<UserAvatarDto> findFollowingsWithPagination(Long userId, LocalDate lastFollowedAt, Long lastFollowedUser) {
        if (lastFollowedAt == null && lastFollowedUser == null) { // this is the first page
            lastFollowedAt = AppConstants.DEFAULT_MAX_DATE;
        }
        return dsl.select(USERS.ID, USERS.USERNAME, USERS.PROFILE_PICTURE)
                .from(USER_FOLLOWERS)
                .join(USERS)
                .on(USER_FOLLOWERS.FOLLOWED_USER_ID.eq(USERS.ID))
                .where(USER_FOLLOWERS.FOLLOWER_ID.eq(userId))
                .orderBy(USER_FOLLOWERS.FOLLOWED_AT.desc(), USER_FOLLOWERS.FOLLOWED_USER_ID.desc())
                .seek(lastFollowedAt, lastFollowedUser) // and (lastFollowedAt, lastFollowedUserId) < (X, Y)
                .limit(AppConstants.DEFAULT_PAGE_SIZE)
                .fetch(mapping(UserAvatarDto::new));
    }
}
