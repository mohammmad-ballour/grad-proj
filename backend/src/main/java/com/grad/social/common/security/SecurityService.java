package com.grad.social.common.security;

import com.grad.social.model.enums.WhoCanMessage;
import com.grad.social.model.shared.ProfileStatus;
import com.grad.social.repository.user.UserRepository;
import com.grad.social.repository.user.UserUserInteractionRepository;
import com.grad.social.service.chat.ChattingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;

@RequiredArgsConstructor
@Service("SecurityService")
@Slf4j
public class SecurityService {
    private final UserUserInteractionRepository userUserInteractionRepository;
    private final ChattingService chattingService;
    private final UserRepository userRepository;

    public boolean hasUserLongId(Authentication authentication, Long requestedId) {
        if (authentication instanceof JwtAuthenticationToken jwtAuthenticationTokenT) {
            return requestedId.equals(extractUserIdFromAuthentication(jwtAuthenticationTokenT.getToken()));
        }
        return false;
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

    public boolean isParticipantInChat(Jwt jwt, Long chatId) {
        long currentUserId = extractUserIdFromAuthentication(jwt);
        if (currentUserId == -1) {
            return false;       // anonymouse user
        }
        return this.chattingService.isParticipant(chatId, currentUserId);
    }

    public boolean isPermittedToMessage(Jwt jwt, Long recipientId) {
        long currentUserId = extractUserIdFromAuthentication(jwt);
        if (currentUserId == -1) {
            return false;       // anonymouse user
        }
        WhoCanMessage whoCanMessage = this.userRepository.getWhoCanMessage(currentUserId);
        return switch (whoCanMessage) {
            case EVERYONE -> true;
            case FOLLOWERS -> {
                ProfileStatus profileStatus = this.userUserInteractionRepository.getProfileStatus(recipientId, currentUserId);
                yield profileStatus.isProfileFollowedByCurrentUser();
            }
            case NONE -> false;
        };
    }

    private long extractUserIdFromAuthentication(Jwt jwt) {
        if (jwt == null) {
            return -1;
        }
        return Long.parseLong(jwt.getClaimAsString("uid"));
    }


}