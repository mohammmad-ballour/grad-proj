package com.grad.social.repository.user;

import com.grad.grad_proj.generated.api.model.CreateUserDto;
import com.grad.grad_proj.generated.api.model.ProfileResponseDto;
import com.grad.grad_proj.generated.api.model.UserAboutDto;
import com.grad.grad_proj.generated.api.model.UserAvatarDto;
import com.grad.social.common.database.utils.JooqUtils;
import com.grad.social.model.enums.FollowingPriority;
import com.grad.social.model.enums.Gender;
import com.grad.social.model.tables.UserBlocks;
import com.grad.social.model.tables.UserFollowers;
import com.grad.social.model.tables.UserMutes;
import com.grad.social.model.tables.Users;
import com.grad.social.model.tables.records.UsersRecord;
import com.grad.social.model.user.UserBasicData;
import com.grad.social.model.user.UsernameTimezoneId;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.jooq.Field;
import org.jooq.TableField;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

import static org.jooq.Records.mapping;

@Repository
@RequiredArgsConstructor
public class UserRepository {

    private final DSLContext dsl;
    private final Users u = Users.USERS.as("u");
    private final UserBlocks ub = UserBlocks.USER_BLOCKS.as("ub");
    private final UserMutes um = UserMutes.USER_MUTES.as("UM");
    private final UserFollowers uf = UserFollowers.USER_FOLLOWERS.as("uf");

    public ProfileResponseDto fetchUserAccountByName(Long currentUserId, String nameToSearch) {
        Long profileOwnerId = dsl.select(u.ID)
                .from(u)
                .where(u.USERNAME.eq(nameToSearch).or(u.DISPLAY_NAME.eq(nameToSearch)))
                .fetchOneInto(Long.class);
        if (profileOwnerId == null) {
            return null;
        }

        // number of followers of the profile owner
        Field<Integer> followerNumberField = DSL.selectCount()
                .from(uf)
                .where(uf.FOLLOWED_USER_ID.eq(profileOwnerId))
                .asField("followerNo");

        // number of followings of the profile owner
        Field<Integer> followingNumberField = DSL.selectCount()
                .from(uf)
                .where(uf.FOLLOWER_ID.eq(profileOwnerId))
                .asField("followingNo");

        // used for toggling follow button
        Field<Boolean> isBeingFollowedField = Objects.equals(currentUserId, profileOwnerId) ? DSL.val(false).as("isBeingFollowed") : DSL.exists(
                DSL.selectOne()
                        .from(uf)
                        .where(uf.FOLLOWER_ID.eq(currentUserId).and(uf.FOLLOWED_USER_ID.eq(profileOwnerId)))
        ).as("isBeingFollowed");

        // Return the priority or NULL if not following or is self
        Field<FollowingPriority> followingPriorityField = Objects.equals(currentUserId, profileOwnerId) ? DSL.val((FollowingPriority) null).as("followingPriority")
                : DSL.select(uf.FOLLOWING_PRIORITY)
                .from(uf)
                .where(uf.FOLLOWER_ID.eq(currentUserId).and(uf.FOLLOWED_USER_ID.eq(profileOwnerId)))
                .asField("followingPriority");

        Field<Boolean> isBlockedField = Objects.equals(currentUserId, profileOwnerId) ? DSL.val(false).as("isBlocked") : DSL.exists(
                DSL.selectOne()
                        .from(ub)
                        .where(ub.USER_ID.eq(currentUserId).and(ub.BLOCKED_USER_ID.eq(profileOwnerId)))
        ).as("isBlocked");

        Field<Boolean> isMutedField = Objects.equals(currentUserId, profileOwnerId) ? DSL.val(false).as("isMuted") : DSL.exists(
                DSL.selectOne()
                        .from(um)
                        .where(um.USER_ID.eq(currentUserId).and(um.MUTED_USER_ID.eq(profileOwnerId)
                                .and((um.MUTED_UNTIL.isNull()).or(um.MUTED_UNTIL.lt(Instant.now()))
                                )))
        ).as("isMuted");

        return dsl.select(u.ID, u.DISPLAY_NAME, u.USERNAME, u.JOINED_AT, u.PROFILE_PICTURE, u.PROFILE_COVER_PHOTO, u.PROFILE_BIO, u.DOB, u.RESIDENCE, u.GENDER,
                        u.TIMEZONE_ID, followingNumberField, followerNumberField, isBeingFollowedField, followingPriorityField, isBlockedField, isMutedField)
                .from(u)
                .where(u.ID.eq(profileOwnerId))
                .fetchOne(mapping((userId, displayName, username, joinedAt, profilePicture, profileCover, bio, dob, residence, gender,
                                   timezoneId, followingNumber, followerNumber, isBeingFollowed, followingPriority, isBlocked, isMuted) -> {
                    var profile = new ProfileResponseDto(username, new UserAvatarDto(userId, displayName, profilePicture), profileCover, bio, joinedAt,
                            new UserAboutDto(gender.name(), dob, residence, timezoneId));
                    profile.setFollowerNo(followerNumber);
                    profile.setFollowingNo(followingNumber);
                    profile.isBeingFollowed(isBeingFollowed);
                    profile.setFollowingPriority(followingPriority == null ? null : followingPriority.name());
                    profile.isBlocked(isBlocked);
                    profile.isMuted(isMuted);
                    return profile;
                }));
    }

    public Long save(CreateUserDto user) {
        // by default, display_name = username, edited by account owner later
        return dsl.insertInto(u, u.EMAIL, u.USERNAME, u.DISPLAY_NAME, u.DOB, u.GENDER, u.RESIDENCE, u.TIMEZONE_ID)
                .values(user.getEmail(), user.getUsername(), user.getUsername(), user.getDob(), Gender.valueOf(user.getGender().name().toUpperCase()), user.getResidence(), user.getTimezoneId())
                .returning(u.ID).fetchOne().getId();
    }

    public int updateUser(Long userId, Map<TableField<UsersRecord, ?>, Object> fieldsToUpdate) {
        return JooqUtils.update(dsl, u, fieldsToUpdate, u.ID.eq(userId));
    }

    public Optional<UserBasicData> findById(Long userId) {
        return dsl.select(u.DISPLAY_NAME, u.DOB, u.GENDER, u.RESIDENCE, u.TIMEZONE_ID, u.PROFILE_BIO, u.PROFILE_PICTURE, u.PROFILE_COVER_PHOTO)
                .from(u)
                .where(u.ID.eq(userId))
                .fetchOptional(mapping(UserBasicData::new));
    }


    // Utils
    public void deleteAll() {
        JooqUtils.delete(dsl, u, DSL.trueCondition());
    }

    public UsernameTimezoneId getUsernameAndTimezone(Long userId) {
        return dsl.select(u.USERNAME, u.TIMEZONE_ID)
                .from(u)
                .where(u.ID.eq(userId))
                .fetchOneInto(UsernameTimezoneId.class);
    }

    public boolean isAccountOwner(Long currentUserId, String nameToSearch) {
        String currentUsername = dsl.select(u.USERNAME).from(u).where(u.ID.eq(currentUserId)).fetchOneInto(String.class);
        return currentUsername != null && currentUsername.equals(nameToSearch);
    }

    public boolean isAccountProtected(String nameToSearch) {
        Boolean isAccountProtected = dsl.select(u.IS_PROTECTED).where(u.USERNAME.eq(nameToSearch).or(u.DISPLAY_NAME.eq(nameToSearch))).fetchOneInto(Boolean.class);
        return isAccountProtected != null && isAccountProtected;
    }
}
