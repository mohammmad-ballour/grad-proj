package com.grad.social.common.security.firebase;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public class AccountAlreadyExistsException extends ResponseStatusException {

    public AccountAlreadyExistsException(String reason) {
        super(HttpStatus.CONFLICT, reason);
    }

}