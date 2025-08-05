package com.grad.social.service.user.validator;

import com.grad.grad_proj.generated.api.model.CreateUserDto;
import com.grad.social.common.AppConstants;
import com.grad.social.common.validation.ValidationErrorCollector;
import com.grad.social.exception.user.UserErrorCode;
import com.grad.social.model.user.UserBasicData;
import lombok.Getter;
import org.springframework.stereotype.Component;
import org.springframework.util.ObjectUtils;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.zone.ZoneRulesException;

@Component
@Getter
public class UserInfoValidator {

    private final ValidationErrorCollector errorCollector = new ValidationErrorCollector();

    public void validateCreateUserRequest(CreateUserDto createUserRequest) {
        this.validateEmail(createUserRequest.getEmail());
        this.validateUsername(createUserRequest.getUsername());
        this.validatePassword(createUserRequest.getPassword());
        this.validateDob(createUserRequest.getDob());
        this.validateTimezone(createUserRequest.getTimezoneId());
        this.errorCollector.throwIfErrorsExist();
    }

    public void validateUpdateUserRequest(UserBasicData newUser) {
        this.validateDisplayName(newUser.getDisplayName());
        this.validateDob(newUser.getDob());
        this.validateTimezone(newUser.getTimezoneId());
        this.validateBio(newUser.getProfileBio());
        this.errorCollector.throwIfErrorsExist();
    }

    private void validateEmail(String email) {
        if (isFieldEmpty(email))
            return;
        final String emailRegex = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(\\.[a-zA-Z0-9-]+)+$";
        if (!email.trim().matches(emailRegex)) {
            errorCollector.add(UserErrorCode.INVALID_EMAIL_FORMAT);
        }
    }

    private void validateUsername(String username) {
        if (isFieldEmpty(username))
            return;
        username = username.trim();
        final String nameRegex = "^\\p{L}[\\p{L}0-9._-]{1,28}[\\p{L}0-9]$";
        if (username.length() < 3 || username.length() > 16 || !username.matches(nameRegex)) {
            errorCollector.add(UserErrorCode.INVALID_USERNAME_FORMAT);
        }
    }

    private void validateDisplayName(String displayName) {
        if (isFieldEmpty(displayName))
            return;
        displayName = displayName.trim();
        final String displayNameRegex = "^\\p{L}[\\p{L}0-9._\\- ]{1,28}[\\p{L}0-9]$";
        if (!displayName.matches(displayNameRegex)) {
            errorCollector.add(UserErrorCode.INVALID_DISPLAYNAME_FORMAT);
        }
    }

    private void validatePassword(String password) {
        if (isFieldEmpty(password))
            return;
        password = password.trim();
        // 8-32 password with at least 1 letter and 1 digit anywhere and optionally special characters
        final String passwordRegex = "^(?=.*[A-Za-z])(?=.*\\d)[\\S]{8,32}$";
        if (!password.matches(passwordRegex)) {
            errorCollector.add(UserErrorCode.INVALID_PASSWORD_FORMAT);
        }
    }

    private void validateDob(LocalDate dob) {
        if (isFieldEmpty(dob))
            return;
        LocalDate now = LocalDate.now();
        LocalDate tenYearsAgo = now.minusYears(10);
        LocalDate hundredYearsAgo = now.minusYears(100);

        if (dob.isBefore(hundredYearsAgo) || dob.isAfter(tenYearsAgo)) {
            errorCollector.add(UserErrorCode.DATE_OUT_OF_ALLOWED_RANGE);
        }
    }

    private void validateTimezone(String timezoneId) {
        if (isFieldEmpty(timezoneId))
            return;
        timezoneId = timezoneId.trim();
        try {
            var zoneId = ZoneId.of(timezoneId);
        } catch (ZoneRulesException ex) {
            errorCollector.add(UserErrorCode.INVALID_TIMEZONE);
        }
    }

    private void validateBio(String bio) {
        if (bio != null && bio.trim().length() > AppConstants.DEFAULT_STRING_MAX_LENGTH) {
            errorCollector.add(UserErrorCode.TOO_LONG_BIO);
        }
    }

    private boolean isFieldEmpty(Object fieldName) {
        if (fieldName == null || ObjectUtils.isEmpty(fieldName)) {
            errorCollector.add(UserErrorCode.FIELD_IS_EMPTY);
            return true;
        }
        return false;
    }

}
