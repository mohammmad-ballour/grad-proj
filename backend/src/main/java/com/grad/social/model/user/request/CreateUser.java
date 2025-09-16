package com.grad.social.model.user.request;

import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateUser {
    private String email;
    private String username;
    private String password;
    private LocalDate dob;
    private String gender;
    private String residence;
    private String timezoneId;
}
