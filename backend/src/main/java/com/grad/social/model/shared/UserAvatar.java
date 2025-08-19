package com.grad.social.model.shared;

public record UserAvatar(Long userId, String displayName, byte[] profilePicture) {
}
