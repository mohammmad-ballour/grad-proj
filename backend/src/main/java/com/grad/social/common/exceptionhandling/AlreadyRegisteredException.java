package com.grad.social.common.exceptionhandling;

import com.grad.social.common.validation.ErrorCode;
import org.springframework.http.HttpStatus;

public class AlreadyRegisteredException extends AppException {

	public AlreadyRegisteredException(ErrorCode errorCode) {
		super(HttpStatus.CONFLICT, errorCode);
	}

}