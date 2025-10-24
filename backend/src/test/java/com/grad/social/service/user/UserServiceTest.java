package com.grad.social.service.user;

import com.grad.social.base.BaseMockedUnitTest;
import com.grad.social.common.exceptionhandling.AlreadyRegisteredException;
import com.grad.social.common.security.AuthService;
import com.grad.social.common.security.UserKey;
import com.grad.social.exception.user.UserErrorCode;
import com.grad.social.repository.user.UserRepository;
import com.grad.social.service.user.validator.UserInfoValidator;
import com.grad.social.testdata.user.UserTestDate;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Nested;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.springframework.dao.DuplicateKeyException;

import java.util.Map;

import static org.assertj.core.api.AssertionsForClassTypes.assertThatThrownBy;

import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;

class UserServiceTest extends BaseMockedUnitTest {
    @Mock
    private UserRepository userRepository;

    @Mock
    private AuthService authService;

    @Mock
    private UserInfoValidator userValidator;

    @InjectMocks
    private UserService userService;

    private final com.grad.social.model.user.request.CreateUser createUser = UserTestDate.validCreateUser();

    @Nested
    class CreateUser {

        @Test
        void createUser_successfulCreation_callsValidatorRepoAndAuthService() {
            // Arrange
            when(userRepository.save(createUser)).thenReturn(1L);

            // Act
            userService.createUser(createUser);

            // Assert
            verify(userValidator).validateCreateUserRequest(createUser);
            verify(userRepository).save(createUser);
            verify(authService).createUserAccount("1", createUser.getEmail(), createUser.getUsername(), createUser.getPassword(), Map.of(UserKey.TIMEZONE_ID, createUser.getTimezoneId()));
        }

        @Test
        void createUser_duplicateEmail_throwsAlreadyRegisteredException_email() {
            // Arrange
            String message = "duplicate key value violates unique constraint \"users_email_key\" Detail: Key (email)=(user@example.com) already exists.";
            DuplicateKeyException exception = new DuplicateKeyException(message);

            when(userRepository.save(createUser)).thenThrow(exception);

            // Act + Assert
            assertThatThrownBy(() -> userService.createUser(createUser))
                    .isInstanceOf(AlreadyRegisteredException.class)
                    .hasMessageContaining(UserErrorCode.EMAIL_ALREADY_EXISTS.getErrorMessage());
        }

        @Test
        void createUser_duplicateUsername_throwsAlreadyRegisteredException_username() {
            // Arrange
            String message = "duplicate key value violates unique constraint \"users_username_key\" Detail: Key (username)=(user123) already exists.";
            DuplicateKeyException exception = new DuplicateKeyException(message);

            when(userRepository.save(createUser)).thenThrow(exception);

            // Act + Assert
            assertThatThrownBy(() -> userService.createUser(createUser))
                    .isInstanceOf(AlreadyRegisteredException.class)
                    .hasMessageContaining(UserErrorCode.USERNAME_ALREADY_EXISTS.getErrorMessage());
        }

        @Test
        void createUser_duplicateUnknownField_throwsDefaultErrorCode() {
            // Arrange
            String message = "duplicate key value violates unique constraint \"users_key\" Detail: Key (something_else)=(foo) already exists.";
            DuplicateKeyException exception = new DuplicateKeyException(message);

            when(userRepository.save(createUser)).thenThrow(exception);

            // Act + Assert
            assertThatThrownBy(() -> userService.createUser(createUser))
                    .isInstanceOf(AlreadyRegisteredException.class)
                    .hasMessageContaining(UserErrorCode.UNKNOWN_ERROR.getErrorMessage());
        }

    }
}