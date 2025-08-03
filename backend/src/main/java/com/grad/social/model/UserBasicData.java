package com.grad.social.model;

import com.grad.social.model.enums.Gender;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserBasicData {
    private String displayName;
    private LocalDate dob;
    private Gender gender;
    private String residence;
    private String timezoneId;
    private String profileBio;
    private byte[] profilePicture;
    private byte[] profileCoverPhoto;
}
