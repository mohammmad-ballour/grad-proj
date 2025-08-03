package com.grad.social.common.security;

public record CurrentUser(Long userId) {

    @Override
    public String toString() {
        return String.valueOf(userId);
    }
}
