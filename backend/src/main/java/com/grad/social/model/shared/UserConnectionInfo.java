package com.grad.social.model.shared;

import com.grad.social.model.enums.PrivacySettings;

public record UserConnectionInfo(boolean isFollowedByCurrentUser, boolean isFollowingCurrentUser, PrivacySettings whoCanMessage, PrivacySettings whoCanAddToGroups) {
    public boolean areFriends() {
        return isFollowedByCurrentUser && isFollowingCurrentUser;
    }
}
