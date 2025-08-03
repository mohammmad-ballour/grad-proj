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
