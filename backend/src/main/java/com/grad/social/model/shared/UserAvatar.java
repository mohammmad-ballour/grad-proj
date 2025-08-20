package com.grad.social.model.shared;

public record UserAvatar(Long userId, String username, String displayName, byte[] profilePicture) {
}
