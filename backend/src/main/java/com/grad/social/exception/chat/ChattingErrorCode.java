package com.grad.social.exception.chat;

import com.grad.social.common.validation.ErrorCode;
import lombok.Getter;

@Getter
public enum ChattingErrorCode implements ErrorCode {
    // chats

    // messages
    MESSAGE_BODY_REQUIRED("Message must contain at least text content or media file");


    private final String errorMessage;

    ChattingErrorCode() {
        this.errorMessage = name().toLowerCase().replace("_", " ");
    }


    ChattingErrorCode(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    @Override
    public String getMessage() {
        return errorMessage;
    }
}
