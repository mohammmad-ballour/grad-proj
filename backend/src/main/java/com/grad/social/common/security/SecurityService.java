package com.grad.social.common.security;

import com.grad.social.model.enums.PrivacySettings;
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

import java.util.Map;
import java.util.Set;

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
        if (isAnonymous(currentUserId)) return false;
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
        if (isAnonymous(currentUserId)) return false;
        return this.chattingService.isParticipant(chatId, currentUserId);
    }

    public boolean isPermittedToMessage(Jwt jwt, Long recipientId) {
        long currentUserId = extractUserIdFromAuthentication(jwt);
        if (isAnonymous(currentUserId)) return false;
        PrivacySettings whoCanMessage = this.userRepository.getWhoCanMessage(currentUserId);
        return switch (whoCanMessage) {
            case EVERYONE -> true;
            case FOLLOWERS -> this.userUserInteractionRepository.isFollowedByCurrentUser(recipientId, currentUserId);
            case NONE -> false;
        };
    }

    public boolean isPermittedToAddToGroup(Jwt jwt, Set<Long> recipientIds) {
        long currentUserId = extractUserIdFromAuthentication(jwt);
        if (isAnonymous(currentUserId)) return false;
        PrivacySettings whoCanMessage = this.userRepository.getWhoCanAddToGroup(currentUserId);
        return switch (whoCanMessage) {
            case EVERYONE -> true;
            case FOLLOWERS -> {
                Map<Long, Boolean> followedByCurrentUser = this.userUserInteractionRepository.isFollowedByCurrentUser(recipientIds, currentUserId);
                yield followedByCurrentUser.values().stream().allMatch(b -> b);
            }
            case NONE -> false;
        };
    }

    private boolean isAnonymous(long currentUserId) {
        return currentUserId == -1;
    }

    private long extractUserIdFromAuthentication(Jwt jwt) {
        if (jwt == null) {
            return -1;
        }
        return Long.parseLong(jwt.getClaimAsString("uid"));
    }


}