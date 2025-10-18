package com.grad.social.common.security;

import com.grad.social.common.exceptionhandling.ActionNotAllowedException;
import com.grad.social.common.exceptionhandling.BusinessRuleViolationException;
import com.grad.social.common.model.exception.AuthErrorCode;
import com.grad.social.exception.status.StatusErrorCode;
import com.grad.social.model.enums.ParentAssociation;
import com.grad.social.model.enums.PrivacySettings;
import com.grad.social.model.enums.StatusAudience;
import com.grad.social.model.enums.StatusPrivacy;
import com.grad.social.model.shared.ProfileStatus;
import com.grad.social.model.shared.UserConnectionInfo;
import com.grad.social.model.status.request.CreateStatusRequest;
import com.grad.social.model.status.request.ReactToStatusRequest;
import com.grad.social.model.status.response.StatusPrivacyInfo;
import com.grad.social.repository.chat.ChattingRepository;
import com.grad.social.repository.status.StatusRepository;
import com.grad.social.repository.user.UserRepository;
import com.grad.social.repository.user.UserStatusInteractionRepository;
import com.grad.social.repository.user.UserUserInteractionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Set;

import static com.grad.social.model.enums.PrivacySettings.*;

@RequiredArgsConstructor
@Service("SecurityService")
@Slf4j
public class SecurityService {
    private final UserUserInteractionRepository userUserInteractionRepository;
    private final ChattingRepository chattingRepository;
    private final UserRepository userRepository;
    private final StatusRepository statusRepository;
    private final UserStatusInteractionRepository userStatusInteractionRepository;


    public boolean hasUserLongId(Authentication authentication, Long requestedId) {
        if (authentication instanceof JwtAuthenticationToken jwtAuthenticationTokenT) {
            return requestedId.equals(extractUserIdFromAuthentication(jwtAuthenticationTokenT.getToken()));
        }
        return false;
    }

    public boolean canAccessProfileProtectedData(Jwt jwt, Long profileOwnerId) {
        long currentUserId = extractUserIdFromAuthentication(jwt);
        checkAnonymous(currentUserId);
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
        checkAnonymous(currentUserId);
        return this.chattingRepository.isParticipant(chatId, currentUserId);
    }

    public boolean isSelfMessage(Jwt jwt, Long messageId) {
        long currentUserId = extractUserIdFromAuthentication(jwt);
        checkAnonymous(currentUserId);
        return this.chattingRepository.isSelfMessage(currentUserId, messageId);
    }

    public boolean isPermittedToMessage(Jwt jwt, Long recipientId) {
        long currentUserId = extractUserIdFromAuthentication(jwt);
        checkAnonymous(currentUserId);
        Map<Long, UserConnectionInfo> connectionWithOthersInfo = userUserInteractionRepository.getConnectionWithOthersInfo(Set.of(recipientId), currentUserId);
        return checkPrivacySettings(connectionWithOthersInfo, "WHO_CAN_MESSAGE");
    }

    public boolean isPermittedToAddToGroup(Jwt jwt, Set<Long> recipientIds) {
        long currentUserId = extractUserIdFromAuthentication(jwt);
        checkAnonymous(currentUserId);
        Map<Long, UserConnectionInfo> connectionWithOthersInfo = userUserInteractionRepository.getConnectionWithOthersInfo(recipientIds, currentUserId);
        return checkPrivacySettings(connectionWithOthersInfo, "WHO_CAN_ADD_TO_GROUPS");
    }

    private boolean checkPrivacySettings(Map<Long, UserConnectionInfo> userConnectionInfoMap, String privacySetting) {
        boolean result = true;
        for (Map.Entry<Long, UserConnectionInfo> entry : userConnectionInfoMap.entrySet()) {
            UserConnectionInfo userConnectionInfo = entry.getValue();
            PrivacySettings privacySettings = null;
            if (privacySetting.equals("WHO_CAN_MESSAGE")) {
                privacySettings = userConnectionInfo.whoCanMessage();
            } else if (privacySetting.equals("WHO_CAN_ADD_TO_GROUPS")) {
                privacySettings = userConnectionInfo.whoCanAddToGroups();
            } else {
                log.error("Invalid privacy setting: {}", privacySetting);
            }

            result = switch (privacySettings) {
                case EVERYONE -> true;
                case FRIENDS -> userConnectionInfo.areFriends();
                case FOLLOWERS -> userConnectionInfo.isFollowedByCurrentUser();
                case NONE -> false;
                default -> false;
            };
            if (!result) break;
        }
        return result;
    }

    public boolean checkCanCreateStatus(Jwt jwt, CreateStatusRequest toCreate) {
        long currentUserId = extractUserIdFromAuthentication(jwt);
        checkAnonymous(currentUserId);

        if (!arePrivacyAndAudiencesCompatible(toCreate.privacy(), toCreate.replyAudience(), toCreate.shareAudience())) {
            throw new BusinessRuleViolationException(StatusErrorCode.INVALID_STATUS_PRIVACY_OR_AUDIENCE);
        }

        var parentStatus = toCreate.parentStatus();
        // an original status
        if (parentStatus == null || parentStatus.statusId() == null) {
            return true;
        }

        Long parentStatusId = Long.parseLong(parentStatus.statusId());
        ParentAssociation parentAssociation = parentStatus.parentAssociation();

        var parentStatusPrivacyInfo = this.statusRepository.getStatusPrivacyInfo(parentStatusId);
        var parentStatusOwner = parentStatusPrivacyInfo.statusOwnerId();
        var parentStatusPrivacy = parentStatusPrivacyInfo.privacy();

        // reject if the parent is private and not owned by the current user
        if (parentStatusPrivacy == StatusPrivacy.PRIVATE && !parentStatusOwner.equals(currentUserId)) return false;

        // reject if child privacy and audience are different from parent (reply) and if child-parent privacy is not compatible (share)
        if (parentAssociation == ParentAssociation.REPLY) {
            boolean replyAllowed = toCreate.privacy() == parentStatusPrivacy
                    || toCreate.replyAudience() == parentStatusPrivacyInfo.replyAudience() || toCreate.shareAudience() == parentStatusPrivacyInfo.shareAudience();
            if (!replyAllowed) {
                throw new BusinessRuleViolationException(StatusErrorCode.INVALID_STATUS_PRIVACY_OR_AUDIENCE);
            }
        } else if (parentAssociation == ParentAssociation.SHARE) {
            boolean shareAllowed = this.isShareAllowed(parentStatusPrivacy, toCreate.privacy());
            if (!shareAllowed) {
                throw new BusinessRuleViolationException(StatusErrorCode.INVALID_STATUS_PRIVACY_OR_AUDIENCE);
            }
        }

        UserConnectionInfo connectionInfo = this.userUserInteractionRepository.getConnectionWithOthersInfo(Set.of(parentStatusOwner), currentUserId).get(parentStatusOwner);
        boolean followedByCurrentUser = connectionInfo.isFollowedByCurrentUser();

        // REPLY or SHARE
        if (parentAssociation == ParentAssociation.REPLY) {
            var parentStatusReplyAudience = parentStatusPrivacyInfo.replyAudience();
            boolean result = parentStatusReplyAudience == StatusAudience.EVERYONE
                    || (parentStatusReplyAudience == StatusAudience.FOLLOWERS && (followedByCurrentUser || parentStatusOwner.equals(currentUserId)))
                    || (parentStatusReplyAudience == StatusAudience.ONLY_ME && parentStatusOwner.equals(currentUserId));
            if (!result) {
                throw new ActionNotAllowedException(StatusErrorCode.NOT_ALLOWED_TO_REPLY_TO_STATUS);
            }
            return true;
        } else if (parentAssociation == ParentAssociation.SHARE) {
            var parentStatusShareAudience = parentStatusPrivacyInfo.shareAudience();
            boolean result = parentStatusShareAudience == StatusAudience.EVERYONE
                    || (parentStatusShareAudience == StatusAudience.FOLLOWERS && (followedByCurrentUser || parentStatusOwner.equals(currentUserId)))
                    || (parentStatusShareAudience == StatusAudience.ONLY_ME && parentStatusOwner.equals(currentUserId));
            if (!result) {
                throw new ActionNotAllowedException(StatusErrorCode.NOT_ALLOWED_TO_SHARE_STATUS);
            }
            return true;
        }

        return false;
    }

    private boolean isShareAllowed(StatusPrivacy parentPrivacy, StatusPrivacy childPrivacy) {
        if (parentPrivacy == StatusPrivacy.PUBLIC) {
            return true;
        } else if (parentPrivacy == StatusPrivacy.PRIVATE) {
            return childPrivacy == StatusPrivacy.PRIVATE;
        } else if (parentPrivacy == StatusPrivacy.FOLLOWERS) {
            return childPrivacy == StatusPrivacy.FOLLOWERS || childPrivacy == StatusPrivacy.PRIVATE;
        }
        return false;
    }

    private boolean arePrivacyAndAudiencesCompatible(StatusPrivacy privacy, StatusAudience replyAudience, StatusAudience shareAudience) {
        boolean publicPrivacy = privacy == StatusPrivacy.PUBLIC;
        boolean privatePrivacy = privacy == StatusPrivacy.PRIVATE && (replyAudience == StatusAudience.ONLY_ME || shareAudience == StatusAudience.ONLY_ME);
        boolean followersPrivacy = privacy == StatusPrivacy.FOLLOWERS && (replyAudience != StatusAudience.EVERYONE || shareAudience != StatusAudience.EVERYONE);
        return publicPrivacy || privatePrivacy || followersPrivacy;
    }

    public boolean isStatusOwner(Jwt jwt, Long statusId) {
        long currentUserId = extractUserIdFromAuthentication(jwt);
        checkAnonymous(currentUserId);

        StatusPrivacyInfo statusPrivacyInfo = this.statusRepository.getStatusPrivacyInfo(statusId);
        var res = statusPrivacyInfo.statusOwnerId().equals(currentUserId);
        if (!res) {
            throw new ActionNotAllowedException(StatusErrorCode.NOT_ALLOWED_TO_EDIT_STATUS);
        }
        return true;
    }

    public boolean canViewStatus(Jwt jwt, ReactToStatusRequest request) {
        long currentUserId = extractUserIdFromAuthentication(jwt);
        checkAnonymous(currentUserId);
        var res = this.userStatusInteractionRepository.canViewStatus(currentUserId, request.statusId());
        if (!res) {
            throw new ActionNotAllowedException(StatusErrorCode.NOT_ALLOWED_TO_VIEW_STATUS);
        }
        return true;
    }

    private void checkAnonymous(long currentUserId) {
        boolean isAnonymous = currentUserId == -1;
        if (isAnonymous) {
            throw new ActionNotAllowedException(AuthErrorCode.NOT_AVAILABLE_TO_ANONYMOUS_USERS);
        }
    }

    private long extractUserIdFromAuthentication(Jwt jwt) {
        if (jwt == null) {
            return -1;
        }
        return Long.parseLong(jwt.getClaimAsString("uid"));
    }

}