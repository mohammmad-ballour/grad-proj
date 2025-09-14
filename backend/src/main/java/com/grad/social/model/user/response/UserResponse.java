package com.grad.social.model.user.response;

import com.grad.social.model.shared.UserAvatar;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public final class UserResponse {
    private UserAvatar userAvatar;
    private String profileBio;
    private boolean isVerified;
    private Boolean isFollowedByCurrentUser;
    private Boolean isFollowingCurrentUser;
    private Boolean canBeMessagedByCurrentUser;
    private Boolean canBeAddedToGroupByCurrentUser;
}