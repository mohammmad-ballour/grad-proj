package com.grad.social.repository.user;

import com.grad.grad_proj.generated.api.model.CreateUserDto;
import com.grad.grad_proj.generated.api.model.ProfileResponseDto;
import com.grad.grad_proj.generated.api.model.UserAboutDto;
import com.grad.grad_proj.generated.api.model.UserAvatarDto;
import com.grad.social.common.database.utils.JooqUtils;
import com.grad.social.model.UserBasicData;
import com.grad.social.model.enums.Gender;
import com.grad.social.model.tables.records.UsersRecord;
import com.grad.social.model.user.UsernameTimezoneId;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.jooq.TableField;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Repository;

import java.util.Map;
import java.util.Optional;

import static com.grad.social.model.tables.Users.USERS;
import static org.jooq.Records.mapping;

@Repository
@RequiredArgsConstructor
public class UserRepository {

    private final DSLContext dsl;

    public ProfileResponseDto fetchUserAccountByName(String nameToSearch) {
        return dsl.select(USERS.ID, USERS.DISPLAY_NAME, USERS.USERNAME, USERS.JOINED_AT, USERS.PROFILE_PICTURE, USERS.PROFILE_COVER_PHOTO, USERS.PROFILE_BIO, USERS.DOB, USERS.RESIDENCE, USERS.GENDER, USERS.TIMEZONE_ID)
                .from(USERS)
                .where(USERS.USERNAME.eq(nameToSearch).or(USERS.DISPLAY_NAME.eq(nameToSearch)))
                .fetchOne(mapping((userId, displayName, username, joinedAt, profilePicture, profileCover, bio, dob, residence, gender, timezoneId) ->
                        new ProfileResponseDto(userId, username, new UserAvatarDto(profilePicture, displayName), profileCover, bio, joinedAt, new UserAboutDto(gender.name(), dob, residence, timezoneId))));
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
