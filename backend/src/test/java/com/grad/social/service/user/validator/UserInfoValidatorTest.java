package com.grad.social.service.user.validator;

import com.grad.grad_proj.generated.api.model.CreateUserDto;
import com.grad.social.base.BaseTest;
import com.grad.social.common.validation.ValidationException;
import com.grad.social.testdata.user.UserTestDate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;
import static org.assertj.core.api.AssertionsForClassTypes.assertThatThrownBy;

class UserInfoValidatorTest extends BaseTest {
    private UserInfoValidator validator;
    private CreateUserDto createUserDto;

    @BeforeEach
    void setUp() {
        validator = new UserInfoValidator();
        createUserDto = UserTestDate.validCreateUserDto();
    }

    @Test
    void shouldFailOnInvalidEmail() {
        // given
        createUserDto.setEmail("invalid-email");

        // when
        assertThatThrownBy(() -> validator.validateCreateUserRequest(createUserDto))
                .isInstanceOf(ValidationException.class);

        // then
        var errors = validator.getErrorCollector().getErrors();
        assertThat(errors.size()).isEqualTo(1);
    }

    @Test
    void shouldFailOnInvalidUsername() {
        // given
        createUserDto.setUsername("ab"); // Too short or invalid

        // when
        assertThatThrownBy(() -> validator.validateCreateUserRequest(createUserDto))
                .isInstanceOf(ValidationException.class);

        // then
        var errors = validator.getErrorCollector().getErrors();
        assertThat(errors.size()).isEqualTo(1);
    }

    @Test
    void shouldFailOnInvalidPassword() {
        // given
        createUserDto.setPassword("123456"); // No letters

        // when
        assertThatThrownBy(() -> validator.validateCreateUserRequest(createUserDto))
                .isInstanceOf(ValidationException.class);

        // then
        var errors = validator.getErrorCollector().getErrors();
        assertThat(errors.size()).isEqualTo(1);
    }

    @Test
    void shouldFailOnFutureDob() {
        // given
        createUserDto.setDob(LocalDate.now().plusDays(1)); // Future DOB

        // when
        assertThatThrownBy(() -> validator.validateCreateUserRequest(createUserDto))
                .isInstanceOf(ValidationException.class);

        // then
        var errors = validator.getErrorCollector().getErrors();
        assertThat(errors.size()).isEqualTo(1);
    }

    @Test
    void shouldFailOnInvalidTimezone() {
        // given
        createUserDto.setTimezoneId("Afriaca/Cairooo");

        // when
        assertThatThrownBy(() -> validator.validateCreateUserRequest(createUserDto))
                .isInstanceOf(ValidationException.class);

        // then
        var errors = validator.getErrorCollector().getErrors();
        assertThat(errors.size()).isEqualTo(1);
    }
}