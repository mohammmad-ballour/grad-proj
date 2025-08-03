package com.grad.social.common.exceptionhandling;

import com.grad.social.common.validation.ErrorCode;
import org.springframework.http.HttpStatus;

public class ActionNotAllowedException extends AppException {

	public ActionNotAllowedException(ErrorCode errorCode) {
		super(HttpStatus.FORBIDDEN, errorCode);
	}

}