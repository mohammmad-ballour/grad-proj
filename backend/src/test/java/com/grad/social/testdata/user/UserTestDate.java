package com.grad.social.testdata.user;

import com.grad.social.model.user.request.CreateUser;

import java.time.LocalDate;

public class UserTestDate {

    public static CreateUser validCreateUser() {
        var user = new CreateUser();
        user.setEmail("sayed-hasan@example.net");
        user.setUsername("sayed");
        user.setPassword("qabaaa12_12");
        user.setGender("MALE");
        user.setDob(LocalDate.of(2002, 1, 1));
        user.setResidence("Gaza");
        user.setTimezoneId("Africa/Cairo");
        return user;
    }

    public static CreateUser invalidCreateUserDto() {
        var user = new CreateUser();
        user.setEmail("sayed-hasan");
        user.setUsername("hasan12");
        user.setPassword("secret12_14");
        user.setDob(LocalDate.of(2002, 1, 1));
        user.setResidence("Gaza");
        user.setTimezoneId("Africa/Cairo");
        return user;
    }

}
