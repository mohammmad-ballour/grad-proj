package com.grad.social.model.user.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public final class UserSeekResponse {
    private Long userId;
    private String username;
    private String displayName;
    private byte[] profilePicture;
    private Instant actionHappenedAt;
    private String profileBio;
    private boolean isVerified;
    private Boolean isFollowedByCurrentUser;
    private Boolean isFollowingCurrentUser;
}