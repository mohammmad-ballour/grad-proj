package com.grad.social.service.user;

import com.grad.grad_proj.generated.api.model.CreateUserDto;
import com.grad.grad_proj.generated.api.model.ProfileResponseDto;
import com.grad.social.common.exceptionhandling.AlreadyRegisteredException;
import com.grad.social.common.exceptionhandling.Model;
import com.grad.social.common.exceptionhandling.ModelNotFoundException;
import com.grad.social.common.security.AuthService;
import com.grad.social.common.security.UserKey;
import com.grad.social.common.validation.ErrorCode;
import com.grad.social.exception.user.UserErrorCode;
import com.grad.social.model.user.UserBasicData;
import com.grad.social.model.tables.records.UsersRecord;
import com.grad.social.repository.user.UserRepository;
import com.grad.social.service.user.validator.UserInfoValidator;
import lombok.RequiredArgsConstructor;
import org.jooq.TableField;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.grad.social.model.tables.Users.USERS;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final UserInfoValidator userValidator;
    private final AuthService authService;

    public ProfileResponseDto fetchUserAccountByName(Long currentUserId, String nameToSearch) {
        // Todo: hide post list if account is protected
//        boolean isAccountProtected = this.userRepository.isAccountProtected(nameToSearch);
//        boolean currentUserAccount = this.userRepository.isAccountOwner(currentUserId, nameToSearch);
//        if (isAccountProtected && !currentUserAccount)
        return this.userRepository.fetchUserProfileByName(currentUserId, nameToSearch);
    }

    public void createUser(CreateUserDto user) {
        this.userValidator.validateCreateUserRequest(user);
        try {
            Long userId = this.userRepository.save(user);
            if (userId != null) {
                // save user's security-related info in the identity provider
                this.authService.createUserAccount(userId.toString(), user.getEmail(), user.getUsername(), user.getPassword(), Map.of(UserKey.TIMEZONE_ID, user.getTimezoneId()));
            }
        } catch (DuplicateKeyException ex) {
            Pattern DUPLICATE_KEY_PATTERN = Pattern.compile("Key \\((.*?)\\)=");
            Matcher matcher = DUPLICATE_KEY_PATTERN.matcher(ex.getMessage());
            String conflictingField = matcher.find() ? matcher.group(1) : null;
            ErrorCode errorCode = UserErrorCode.UNKNOWN_ERROR;
            if (conflictingField != null)
                if (conflictingField.equals("email")) {
                    errorCode = UserErrorCode.EMAIL_ALREADY_EXISTS;
                } else if (conflictingField.equals("username")) {
                    errorCode = UserErrorCode.USERNAME_ALREADY_EXISTS;
                }
            throw new AlreadyRegisteredException(errorCode);
        }
    }

    public void updateUser(Long userId, UserBasicData userBasicData, MultipartFile profilePicture, MultipartFile profileCoverPhoto) throws IOException {
        var byId = this.userRepository.findById(userId);
        if (byId.isEmpty()) {
            throw new ModelNotFoundException(Model.USER, userId);
        }
        var existingUser = byId.get();
        this.userValidator.validateUpdateUserRequest(userBasicData);

        Map<TableField<UsersRecord, ?>, Object> fieldsToUpdateInDb = new HashMap<>();
        Map<UserKey, Object> fieldsToUpdateInAuthProvider = new HashMap<>();
        if (!userBasicData.getDisplayName().equals(existingUser.getDisplayName()))
            fieldsToUpdateInDb.put(USERS.DISPLAY_NAME, userBasicData.getDisplayName());

        if (!userBasicData.getDob().isEqual(existingUser.getDob()))
            fieldsToUpdateInDb.put(USERS.DOB, userBasicData.getDob());

        if (userBasicData.getGender() != existingUser.getGender())
            fieldsToUpdateInDb.put(USERS.GENDER, userBasicData.getGender());

        if (!userBasicData.getResidence().equals(existingUser.getResidence()))
            fieldsToUpdateInDb.put(USERS.RESIDENCE, userBasicData.getResidence());

        if (!userBasicData.getTimezoneId().equals(existingUser.getTimezoneId())) {
            fieldsToUpdateInDb.put(USERS.TIMEZONE_ID, userBasicData.getTimezoneId());
            fieldsToUpdateInAuthProvider.put(UserKey.TIMEZONE_ID, userBasicData.getTimezoneId());
        }

        if (!userBasicData.getProfileBio().equals(existingUser.getProfileBio()))
            fieldsToUpdateInDb.put(USERS.PROFILE_BIO, userBasicData.getProfileBio());

        if (profilePicture != null && !Arrays.equals(profilePicture.getBytes(), existingUser.getProfilePicture()))
            fieldsToUpdateInDb.put(USERS.PROFILE_PICTURE, profilePicture.getBytes());

        if (profileCoverPhoto != null && !Arrays.equals(profileCoverPhoto.getBytes(), existingUser.getProfileCoverPhoto()))
            fieldsToUpdateInDb.put(USERS.PROFILE_COVER_PHOTO, profileCoverPhoto.getBytes());

        int recordsUpdated = this.userRepository.updateUser(userId, fieldsToUpdateInDb);
        if (recordsUpdated == 0) {
            throw new ModelNotFoundException(Model.USER, userId);
        }
        this.authService.updateUserAccount(existingUser.getUsername(), fieldsToUpdateInAuthProvider);
    }
}
