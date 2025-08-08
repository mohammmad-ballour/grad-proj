package com.grad.social.repository.user;

import com.grad.grad_proj.generated.api.model.CreateUserDto;
import com.grad.grad_proj.generated.api.model.ProfileResponseDto;
import com.grad.grad_proj.generated.api.model.UserAboutDto;
import com.grad.grad_proj.generated.api.model.UserAvatarDto;
import com.grad.social.common.database.utils.JooqUtils;
import com.grad.social.model.enums.FollowingPriority;
import com.grad.social.model.user.UserBasicData;
import com.grad.social.model.enums.Gender;
import com.grad.social.model.tables.records.UsersRecord;
import com.grad.social.model.user.UsernameTimezoneId;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.jooq.Field;
import org.jooq.TableField;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Repository;

import java.util.Map;
import java.util.Objects;
import java.util.Optional;

import static com.grad.social.model.tables.UserBlocks.USER_BLOCKS;
import static com.grad.social.model.tables.UserMutes.USER_MUTES;
import static com.grad.social.model.tables.Users.USERS;
import static com.grad.social.model.tables.UserFollowers.USER_FOLLOWERS;
import static org.jooq.Records.mapping;

@Repository
@RequiredArgsConstructor
public class UserRepository {

    private final DSLContext dsl;

    public ProfileResponseDto fetchUserAccountByName(Long currentUserId, String nameToSearch) {
        Long profileOwnerId = dsl.select(USERS.ID)
                .from(USERS)
                .where(USERS.USERNAME.eq(nameToSearch).or(USERS.DISPLAY_NAME.eq(nameToSearch)))
                .fetchOneInto(Long.class);
        if (profileOwnerId == null) {
            return null;
        }

        // number of followers of the profile owner
        Field<Integer> followerNumberField = DSL.selectCount()
                .from(USER_FOLLOWERS)
                .where(USER_FOLLOWERS.FOLLOWED_USER_ID.eq(profileOwnerId))
                .asField("followerNo");

        // number of followings of the profile owner
        Field<Integer> followingNumberField = DSL.selectCount()
                .from(USER_FOLLOWERS)
                .where(USER_FOLLOWERS.FOLLOWER_ID.eq(profileOwnerId))
                .asField("followingNo");

        // used for toggling follow button
        Field<Boolean> isBeingFollowedField = Objects.equals(currentUserId, profileOwnerId) ? DSL.val(false).as("isBeingFollowed") : DSL.exists(
                DSL.selectOne()
                        .from(USER_FOLLOWERS)
                        .where(USER_FOLLOWERS.FOLLOWER_ID.eq(currentUserId).and(USER_FOLLOWERS.FOLLOWED_USER_ID.eq(profileOwnerId)))
        ).as("isBeingFollowed");

        // Return the priority or NULL if not following or is self
        Field<FollowingPriority> followingPriorityField = Objects.equals(currentUserId, profileOwnerId) ? DSL.val((FollowingPriority) null).as("followingPriority")
                : DSL.select(USER_FOLLOWERS.FOLLOWING_PRIORITY)
                .from(USER_FOLLOWERS)
                .where(USER_FOLLOWERS.FOLLOWER_ID.eq(currentUserId).and(USER_FOLLOWERS.FOLLOWED_USER_ID.eq(profileOwnerId)))
                .asField("followingPriority");

        Field<Boolean> isBlockedField = Objects.equals(currentUserId, profileOwnerId) ? DSL.val(false).as("isBlocked") : DSL.exists(
                DSL.selectOne()
                        .from(USER_BLOCKS)
                        .where(USER_BLOCKS.USER_ID.eq(currentUserId).and(USER_BLOCKS.BLOCKED_USER_ID.eq(profileOwnerId)))
        ).as("isBlocked");

        Field<Boolean> isMutedField = Objects.equals(currentUserId, profileOwnerId) ? DSL.val(false).as("isMuted") : DSL.exists(
                DSL.selectOne()
                        .from(USER_MUTES)
                        .where(USER_MUTES.USER_ID.eq(currentUserId).and(USER_MUTES.MUTED_USER_ID.eq(profileOwnerId).and(USER_MUTES.MUTED_UNTIL.isNotNull())))
        ).as("isMuted");

        return dsl.select(USERS.ID, USERS.DISPLAY_NAME, USERS.USERNAME, USERS.JOINED_AT, USERS.PROFILE_PICTURE, USERS.PROFILE_COVER_PHOTO, USERS.PROFILE_BIO, USERS.DOB, USERS.RESIDENCE, USERS.GENDER,
                        USERS.TIMEZONE_ID, followingNumberField, followerNumberField, isBeingFollowedField, followingPriorityField, isBlockedField, isMutedField)
                .from(USERS)
                .where(USERS.ID.eq(profileOwnerId))
                .fetchOne(mapping((userId, displayName, username, joinedAt, profilePicture, profileCover, bio, dob, residence, gender,
                                   timezoneId, followingNumber, followerNumber, isBeingFollowed, followingPriority,isBlocked, isMuted) -> {
                    var profile = new ProfileResponseDto(username, new UserAvatarDto(userId, displayName, profilePicture), profileCover, bio, joinedAt,
                            new UserAboutDto(gender.name(), dob, residence, timezoneId));
                    profile.setFollowerNo(followerNumber);
                    profile.setFollowingNo(followingNumber);
                    profile.isBeingFollowed(isBeingFollowed);
                    profile.setFollowingPriority(followingPriority == null? null : followingPriority.name());
                    profile.isBlocked(isBlocked);
                    profile.isMuted(isMuted);
                    return profile;
                }));
    }

    public Long save(CreateUserDto user) {
        // by default, display_name = username, edited by account owner later
        return dsl.insertInto(USERS, USERS.EMAIL, USERS.USERNAME, USERS.DISPLAY_NAME, USERS.DOB, USERS.GENDER, USERS.RESIDENCE, USERS.TIMEZONE_ID)
                .values(user.getEmail(), user.getUsername(), user.getUsername(), user.getDob(), Gender.valueOf(user.getGender().name().toUpperCase()), user.getResidence(), user.getTimezoneId())
                .returning(USERS.ID).fetchOne().getId();
    }

    public int updateUser(Long userId, Map<TableField<UsersRecord, ?>, Object> fieldsToUpdate) {
        return JooqUtils.update(dsl, USERS, fieldsToUpdate, USERS.ID.eq(userId));
    }

    public Optional<UserBasicData> findById(Long userId) {
        return dsl.select(USERS.DISPLAY_NAME, USERS.DOB, USERS.GENDER, USERS.RESIDENCE, USERS.TIMEZONE_ID, USERS.PROFILE_BIO, USERS.PROFILE_PICTURE, USERS.PROFILE_COVER_PHOTO)
                .from(USERS)
                .where(USERS.ID.eq(userId))
                .fetchOptional(mapping(UserBasicData::new));
    }


    // Utils
    public void deleteAll() {
        JooqUtils.delete(dsl, USERS, DSL.trueCondition());
    }

    public UsernameTimezoneId getUsernameAndTimezone(Long userId) {
        return dsl.select(USERS.USERNAME, USERS.TIMEZONE_ID)
                .from(USERS)
                .where(USERS.ID.eq(userId))
                .fetchOneInto(UsernameTimezoneId.class);
    }

    public boolean isAccountOwner(Long currentUserId, String nameToSearch) {
        String currentUsername = dsl.select(USERS.USERNAME).from(USERS).where(USERS.ID.eq(currentUserId)).fetchOneInto(String.class);
        return currentUsername != null && currentUsername.equals(nameToSearch);
    }

    public boolean isAccountProtected(String nameToSearch) {
        Boolean isAccountProtected = dsl.select(USERS.IS_PROTECTED).where(USERS.USERNAME.eq(nameToSearch).or(USERS.DISPLAY_NAME.eq(nameToSearch))).fetchOneInto(Boolean.class);
        return isAccountProtected != null && isAccountProtected;
    }
}
