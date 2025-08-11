package com.grad.social.common.security;

import com.grad.social.model.shared.ProfileStatus;
import com.grad.social.repository.user.UserUserInteractionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

@RequiredArgsConstructor
@Service("SecurityService")
@Slf4j
public class SecurityService {
    private final UserUserInteractionRepository userUserInteractionRepository;

    public boolean hasUserLongId(Authentication authentication, Long requestedId) {
        try {
            long accountId = extractUserIdFromAuthentication(authentication);
            return accountId != -1 && accountId == requestedId;
        } catch (Exception e) {
            log.error(e.getMessage(), e);
            return false;
        }
    }

    public boolean canAccessProfileProtectedData(Jwt jwt, Long profileOwnerId) {
        long currentUserId = extractUserIdFromAuthentication(jwt);
        if (currentUserId == -1) {
            return false;       // anonymouse user
        }
        ProfileStatus profileStatus = this.userUserInteractionRepository.getProfileStatus(profileOwnerId, currentUserId);
        boolean isTargetProfileBlockedByCurrentUser = profileStatus.isProfileBlockedByCurrentUser();
        if (isTargetProfileBlockedByCurrentUser) {
            return false;
        }
        boolean isProfileProtected = profileStatus.isProtected();
        if (!isProfileProtected) {
            return true;
        }
        return profileStatus.isProfileFollowedByCurrentUser();
    }

    private long extractUserIdFromAuthentication(Authentication authentication) {
        if (authentication == null) {
            return -1;
        }
        return Long.parseLong(authentication.getName());
    }

    private long extractUserIdFromAuthentication(Jwt jwt) {
        if (jwt == null) {
            return -1;
        }
        return Long.parseLong(jwt.getClaimAsString("uid"));
    }

}