package com.grad.social.common.exceptionhandling;

import com.grad.social.common.validation.ErrorCode;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public abstract class AppException extends RuntimeException {
    private final ErrorCode errorCode;
    private final HttpStatus httpStatus;

    protected AppException(HttpStatus httpStatus, ErrorCode errorCode) {
        this(errorCode.getMessage(), httpStatus, errorCode);
    }

    protected AppException(String message, HttpStatus httpStatus, ErrorCode errorCode) {
        super(message);
        this.errorCode = errorCode;
        this.httpStatus = httpStatus;
    }

    protected AppException(String message, HttpStatus httpStatus, Exception e, ErrorCode errorCode) {
        super(message, e);
        this.errorCode = errorCode;
        this.httpStatus = httpStatus;
    }
    
}