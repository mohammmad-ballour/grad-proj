package com.grad.social.testdata.user;

import com.grad.grad_proj.generated.api.model.CreateUserDto;

import java.time.LocalDate;

public class UserTestDate {

    public static CreateUserDto validCreateUserDto() {
        return new CreateUserDto(
                "mohbalor@example.com",
                "mohbalor",
                "secret123",
                LocalDate.of(2002, 1, 1),
                CreateUserDto.GenderEnum.MALE,
                "Istanbul",
                "Asia/Jerusalem"
        );
    }

    public static CreateUserDto invalidCreateUserDto() {
        return new CreateUserDto(
                "mohbalor@example",     // INVALID
                "mohbalor",
                "secret123",
                LocalDate.of(2002, 1, 1),
                CreateUserDto.GenderEnum.MALE,
                "Istanbul",
                "Asia/Jerusalem"
        );
    }

}
