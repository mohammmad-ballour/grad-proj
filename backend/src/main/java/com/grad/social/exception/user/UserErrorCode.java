package com.grad.social.exception.user;

import lombok.Getter;
import com.grad.social.common.validation.ErrorCode;

@Getter
public enum UserErrorCode implements ErrorCode {

	// null or empty
	FIELD_IS_EMPTY, UNKNOWN_ERROR,

	// domain violation
	INVALID_EMAIL_FORMAT, INVALID_USERNAME_FORMAT, INVALID_DISPLAYNAME_FORMAT, INVALID_PASSWORD_FORMAT, INVALID_TIMEZONE, TOO_LONG_BIO,

	// account existence
	EMAIL_ALREADY_EXISTS, USERNAME_ALREADY_EXISTS, USER_ALREADY_EXISTS, USER_NOT_FOUND, CANNOT_CREATE_ACCOUNT,

    // user-to-user interactions
    CANNOT_FOLLOW_SELF, CANNOT_BLOCK_SELF, CANNOT_MUTE_SELF, CANNOT_UNFOLLOW_SELF, CANNOT_UNBLOCK_SELF,
    CANNOT_UNMUTE_SELF, TARGET_ALREADY_FOLLOWED, TARGET_ALREADY_BLOCKED, TARGET_ALREADY_MUTED, TARGET_NOT_FOLLOWED,
    TARGET_NOT_BLOCKED, TARGET_NOT_MUTED,

    // user actions
    ALREADY_FOLLOWED, ALREADY_BLOCKED, ALREADY_MUTED,

	// date/time
	DATE_OUT_OF_ALLOWED_RANGE,

	// account verification (for later)
	USER_ALREADY_VERIFIED, USER_NOT_VERIFIED, USER_VERIFICATION_FAILED;

	private final String errorMessage;

	UserErrorCode() {
		this.errorMessage = name().toLowerCase().replace("_", " ");
	}

	UserErrorCode(String errorMessage) {
		this.errorMessage = errorMessage;
	}

	@Override
	public String getMessage() {
		return errorMessage;
	}

}
