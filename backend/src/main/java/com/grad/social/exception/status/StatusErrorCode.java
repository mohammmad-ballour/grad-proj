package com.grad.social.exception.status;

import com.grad.social.common.validation.ErrorCode;
import lombok.Getter;

@Getter
public enum StatusErrorCode implements ErrorCode {
    ALREADY_LIKED_STATUS,
    ALREADY_UNLIKED_STATUS,

    STATUS_ALREADY_EXISTS,
    NOT_ALLOWED_TO_VIEW_STATUS,
    NOT_ALLOWED_TO_EDIT_STATUS,
    NOT_ALLOWED_TO_REPLY_TO_STATUS,
    NOT_ALLOWED_TO_SHARE_STATUS,
    NOT_ALLOWED_TO_UPDATE_REPLY_SETTINGS("Replies cannot update audiences (they inherit from parent)"),

    INVALID_STATUS_PRIVACY_OR_AUDIENCE;

    private final String errorMessage;

    StatusErrorCode() {
        this.errorMessage = name().toLowerCase().replace("_", " ");
    }

    StatusErrorCode(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    @Override
    public String getMessage() {
        return this.name();
    }

}
