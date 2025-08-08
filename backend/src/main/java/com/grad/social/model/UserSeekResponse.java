package com.grad.social.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.temporal.Temporal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public final class UserSeekResponse {
    private Long userId;
    private String displayName;
    private byte[] profilePicture;
    private Temporal actionHappenedAt;
    private String profileBio;

}