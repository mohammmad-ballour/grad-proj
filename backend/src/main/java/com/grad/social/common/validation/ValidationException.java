package com.grad.social.common.validation;

import java.util.Set;

public class ValidationException extends RuntimeException {

	public ValidationException(Set<? extends ErrorCode> errors) {
		super("There are " + errors.size() + " validation errors.\nErrors: " + errors);
	}

}
