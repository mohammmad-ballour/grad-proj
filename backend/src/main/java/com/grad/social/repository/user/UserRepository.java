package com.grad.social.repository.user;

import com.grad.social.common.AppConstants;
import com.grad.social.common.database.utils.JooqUtils;
import com.grad.social.common.messaging.redis.RedisConstants;
import com.grad.social.model.enums.FollowingPriority;
import com.grad.social.model.enums.Gender;
import com.grad.social.model.shared.UserAvatar;
import com.grad.social.model.tables.*;
import com.grad.social.model.tables.records.UsersRecord;
import com.grad.social.model.user.helper.UserBasicData;
import com.grad.social.model.user.request.CreateUser;
import com.grad.social.model.user.response.ProfileResponse;
import com.grad.social.model.user.response.UserAbout;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.jooq.Field;
import org.jooq.TableField;
import org.jooq.impl.DSL;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

import static com.grad.social.model.enums.PrivacySettings.FRIENDS;
import static com.grad.social.model.enums.PrivacySettings.FOLLOWERS;
import static com.grad.social.model.enums.PrivacySettings.EVERYONE;
import static com.grad.social.model.enums.PrivacySettings.NONE;
import static org.jooq.Records.mapping;

@Repository
@RequiredArgsConstructor
public class UserRepository {
    private final DSLContext dsl;
    private final RedisTemplate<String, String> redisTemplate;

    private final Users u = Users.USERS.as("u");
    private final UserBlocks ub = UserBlocks.USER_BLOCKS.as("ub");
    private final UserMutes um = UserMutes.USER_MUTES.as("UM");
    private final UserFollowers uf = UserFollowers.USER_FOLLOWERS.as("uf");

    private final ChatParticipants cp = ChatParticipants.CHAT_PARTICIPANTS;
    private final Messages m = Messages.MESSAGES;
    private final MessageStatus ms = MessageStatus.MESSAGE_STATUS;

    public ProfileResponse fetchUserProfileByName(Long currentUserId, String nameToSearch) {
        Long profileOwnerId = dsl.select(u.ID)
                .from(u)
                .where(u.USERNAME.eq(nameToSearch).or(u.DISPLAY_NAME.eq(nameToSearch)))
                .fetchOneInto(Long.class);
        if (profileOwnerId == null) {
            return null;
        }
        return fetchUserProfileById(currentUserId, profileOwnerId);
    }

    public ProfileResponse fetchUserProfileById(Long currentUserId, Long profileOwnerId) {
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

        // used for toggling follow button
        Field<Boolean> isFollowingCurrentUserField = Objects.equals(currentUserId, profileOwnerId) ? DSL.val(false).as("isFollowingCurrentUserField") : DSL.exists(
                DSL.selectOne()
                        .from(uf)
                        .where(uf.FOLLOWER_ID.eq(profileOwnerId).and(uf.FOLLOWED_USER_ID.eq(currentUserId)))
        ).as("isFollowingCurrentUserField");

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

        Field<Integer> unreadMessagesCount = Objects.equals(currentUserId, profileOwnerId) ? DSL.selectCount()
                .from(ms)
                .join(m).on(ms.MESSAGE_ID.eq(m.MESSAGE_ID))
                .where(ms.USER_ID.eq(currentUserId)
                        .and(ms.READ_AT.isNull())
                        .and(m.SENT_AT.greaterThan(getLastOnline(currentUserId)))
                )
                .asField("unread_messages_count") : DSL.val((Integer) null);

        return dsl.select(u.ID, u.DISPLAY_NAME, u.USERNAME, u.JOINED_AT, u.PROFILE_PICTURE, u.PROFILE_COVER_PHOTO, u.PROFILE_BIO, u.DOB, u.RESIDENCE, u.GENDER,
                        u.TIMEZONE_ID, u.WHO_CAN_MESSAGE, followingNumberField, followerNumberField, isFollowingCurrentUserField, isBeingFollowedField, followingPriorityField,
                        isBlockedField, isMutedField, unreadMessagesCount)
                .from(u)
                .where(u.ID.eq(profileOwnerId))
                .fetchOne(mapping((userId, displayName, username, joinedAt, profilePicture, profileCover, bio, dob, residence, gender,
                                   timezoneId, whoCanMessage, followingNumber, followerNumber, isFollowingCurrentUser, isBeingFollowed, followingPriority,
                                   isBlocked, isMuted, unreadMessages) -> {
                    var profile = new ProfileResponse(new UserAvatar(userId, username, displayName, profilePicture), profileCover, bio, joinedAt,
                            new UserAbout(gender, dob, residence, timezoneId));
                    profile.setFollowerNo(followerNumber);
                    profile.setFollowingNo(followingNumber);
                    profile.setIsBeingFollowed(isBeingFollowed);
                    profile.setFollowingPriority(followingPriority == null ? null : followingPriority.name());
                    profile.setIsBlocked(isBlocked);
                    profile.setIsMuted(isMuted);
                    profile.setCanBeMessaged(
                            switch (whoCanMessage) {
                                case EVERYONE -> true;
                                case FOLLOWERS -> isBeingFollowed;
                                case FRIENDS -> isBeingFollowed && isFollowingCurrentUser;
                                case NONE -> false;
                                default -> throw new IllegalStateException("Unexpected value: " + whoCanMessage);
                            }
                    );
                    profile.setUnreadMessagesCount(unreadMessages);
                    System.out.println("Unread messages = " + unreadMessages);
                    return profile;
                }));
    }

    public Long save(CreateUser user) {
        // by default, display_name = username, edited by account owner later
        return dsl.insertInto(u, u.EMAIL, u.USERNAME, u.DISPLAY_NAME, u.DOB, u.GENDER, u.RESIDENCE, u.TIMEZONE_ID)
                .values(user.getEmail(), user.getUsername(), user.getUsername(), user.getDob(), Gender.valueOf(user.getGender().toUpperCase()), user.getResidence(), user.getTimezoneId())
                .returning(u.ID).fetchOne().getId();
    }

    public int updateUser(Long userId, Map<TableField<UsersRecord, ?>, Object> fieldsToUpdate) {
        return JooqUtils.update(dsl, u, fieldsToUpdate, u.ID.eq(userId));
    }

    public Optional<UserBasicData> findById(Long userId) {
        return dsl.select(u.USERNAME, u.DISPLAY_NAME, u.DOB, u.GENDER, u.RESIDENCE, u.TIMEZONE_ID, u.PROFILE_BIO, u.PROFILE_PICTURE, u.PROFILE_COVER_PHOTO)
                .from(u)
                .where(u.ID.eq(userId))
                .fetchOptional(mapping(UserBasicData::new));
    }

    private Instant getLastOnline(Long userId) {
        Object lastOnlineObj = this.redisTemplate.opsForHash().get(RedisConstants.USERS_SESSION_META_PREFIX.concat(userId.toString()), RedisConstants.LAST_ONLINE_HASH_KEY);
        if (lastOnlineObj == null) {
            // User is currently online
            return AppConstants.DEFAULT_MIN_TIMESTAMP;
        }
        return Instant.parse(lastOnlineObj.toString());
    }


    // Utils
    public void deleteAll() {
        JooqUtils.delete(dsl, u, DSL.trueCondition());
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
