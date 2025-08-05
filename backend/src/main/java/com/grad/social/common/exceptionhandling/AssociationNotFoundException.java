package com.grad.social.common.exceptionhandling;

import com.grad.social.common.validation.ErrorCode;
import lombok.Getter;

@Getter
public class AssociationNotFoundException extends RuntimeException {

	public AssociationNotFoundException(ErrorCode errorCode) {
		super(errorCode.getMessage());
	}

}
