package com.grad.social.model.user.response;

import com.grad.social.model.enums.Gender;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

public record UserAbout(Gender gender,
                        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                        LocalDate dob,
                        String residence,
                        String timezoneId) {

}
