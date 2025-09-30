package com.grad.social.model.user.response;

import com.grad.social.model.shared.UserAvatar;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

@NoArgsConstructor
@Data
public class ProfileResponse {
    private UserAvatar userAvatar;
    private byte[] profileCoverPhoto;
    private String profileBio;
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate joinedAt;
    private UserAbout aboutUser;
    private Integer followingNo;
    private Integer followerNo;
    private Boolean isBeingFollowed;
    private String followingPriority;
    private Boolean isBlocked;
    private Boolean isMuted;
    private Boolean canBeMessaged;
    private Integer unreadMessagesCount;

    public ProfileResponse(UserAvatar userAvatar, byte[] profileCoverPhoto, String profileBio, LocalDate joinedAt, UserAbout aboutUser) {
        this.userAvatar = userAvatar;
        this.profileCoverPhoto = profileCoverPhoto;
        this.profileBio = profileBio;
        this.joinedAt = joinedAt;
        this.aboutUser = aboutUser;
    }
}
