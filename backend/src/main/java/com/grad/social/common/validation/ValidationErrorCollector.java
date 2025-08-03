package com.grad.social.common.validation;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

public class ValidationErrorCollector {

	private final Set<ErrorCode> errors = new HashSet<>();

	public Set<? extends ErrorCode> getErrors() {
		return Collections.unmodifiableSet(errors);
	}

	public <T extends ErrorCode> void add(T errorCode) {
		errors.add(errorCode);
	}

	public void throwIfErrorsExist() throws ValidationException {
		if (!errors.isEmpty()) {
			throw new ValidationException(errors);
		}
	}

}
