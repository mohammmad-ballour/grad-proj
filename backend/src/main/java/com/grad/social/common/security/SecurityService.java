package com.grad.social.common.security;

import com.grad.social.model.enums.PrivacySettings;
import com.grad.social.model.shared.ProfileStatus;
import com.grad.social.model.shared.UserConnectionInfo;
import com.grad.social.repository.chat.ChattingRepository;
import com.grad.social.repository.user.UserRepository;
import com.grad.social.repository.user.UserUserInteractionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicBoolean;

import static com.grad.social.model.enums.PrivacySettings.*;

@RequiredArgsConstructor
@Service("SecurityService")
@Slf4j
public class SecurityService {
    private final UserUserInteractionRepository userUserInteractionRepository;
    private final ChattingRepository chattingRepository;
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
        return this.chattingRepository.isParticipant(chatId, currentUserId);
    }

    public boolean isSelfMessage(Jwt jwt, Long messageId) {
        long currentUserId = extractUserIdFromAuthentication(jwt);
        if (isAnonymous(currentUserId)) return false;
        return this.chattingRepository.isSelfMessage(currentUserId, messageId);
    }

    public boolean isPermittedToMessage(Jwt jwt, Long recipientId) {
        long currentUserId = extractUserIdFromAuthentication(jwt);
        if (isAnonymous(currentUserId)) return false;
        Map<Long, UserConnectionInfo> connectionWithOthersInfo = userUserInteractionRepository.getConnectionWithOthersInfo(Set.of(recipientId), currentUserId);
        return checkPrivacySettings(connectionWithOthersInfo, currentUserId);
    }

    public boolean isPermittedToAddToGroup(Jwt jwt, Set<Long> recipientIds) {
        long currentUserId = extractUserIdFromAuthentication(jwt);
        if (isAnonymous(currentUserId)) return false;
        Map<Long, UserConnectionInfo> connectionWithOthersInfo = userUserInteractionRepository.getConnectionWithOthersInfo(recipientIds, currentUserId);
        return checkPrivacySettings(connectionWithOthersInfo, currentUserId);
    }

    private boolean checkPrivacySettings(Map<Long, UserConnectionInfo> userConnectionInfoMap, long currentUserId) {
        AtomicBoolean result = new AtomicBoolean(false);
        for (Map.Entry<Long, UserConnectionInfo> entry : userConnectionInfoMap.entrySet()) {
            UserConnectionInfo userConnectionInfo = entry.getValue();
            PrivacySettings privacySettings = userConnectionInfo.whoCanAddToGroups();
            switch (privacySettings) {
                case EVERYONE:
                    continue;
                case FRIENDS:
                    boolean areFriends = userConnectionInfo.areFriends();
                    if (!areFriends) break;
                case FOLLOWERS:
                    boolean followedByCurrentUser = userConnectionInfo.isFollowedByCurrentUser();
                    if (!followedByCurrentUser) break;
                default:
                    break;
            }
        }
        return false;
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