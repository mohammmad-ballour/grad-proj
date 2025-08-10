package com.grad.social.model.shared;

public record ProfileStatus(boolean isProfileBlockedByCurrentUser, boolean isProfileFollowedByCurrentUser, boolean isProtected) {
}
