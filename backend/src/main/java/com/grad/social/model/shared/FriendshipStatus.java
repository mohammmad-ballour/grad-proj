package com.grad.social.model.shared;

public record FriendshipStatus(boolean isFollowedByCurrentUser, boolean isFollowingCurrentUser) {
    public boolean areFriends() {
        return isFollowedByCurrentUser && isFollowingCurrentUser;
    }
}
