package com.grad.social.common.model.exception;

import com.grad.social.common.validation.ErrorCode;

public enum AuthErrorCode implements ErrorCode {
    NOT_AVAILABLE_TO_ANONYMOUS_USERS;

    private final String errorMessage;

    AuthErrorCode() {
        this.errorMessage = name().toLowerCase().replace("_", " ");
    }

    AuthErrorCode(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    @Override
    public String getMessage() {
        return this.name();
    }
}