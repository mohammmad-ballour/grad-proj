package com.grad.social.exception.status;

import com.grad.social.common.validation.ErrorCode;

public enum StatusErrorCode implements ErrorCode {
    ALREADY_LIKED_STATUS,
    ALREADY_UNLIKED_STATUS,

    STATUS_ALREADY_EXISTS,
    NOT_ALLOWED_TO_VIEW_STATUS,
    NOT_ALLOWED_TO_EDIT_STATUS,
    NOT_ALLOWED_TO_REPLY_TO_STATUS,
    NOT_ALLOWED_TO_SHARE_STATUS,

    INVALID_STATUS_PRIVACY_OR_AUDIENCE;

    @Override
    public String getMessage() {
        return this.name();
    }

}
