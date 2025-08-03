package com.grad.social.common.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@RequiredArgsConstructor
@Service("SecurityService")
@Slf4j
public class SecurityService {

    public boolean hasUserLongId(Authentication authentication, Long requestedId) {
        try {
            Long accountId = Long.parseLong(authentication.getName());
            return accountId.equals(requestedId);
        } catch (Exception e) {
            log.error(e.getMessage(), e);
            return false;
        }
    }

}