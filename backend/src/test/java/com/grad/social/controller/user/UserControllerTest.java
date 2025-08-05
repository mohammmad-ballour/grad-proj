package com.grad.social.controller.user;

import com.grad.grad_proj.generated.api.model.CreateUserDto;
import com.grad.grad_proj.generated.api.model.ProfileResponseDto;
import com.grad.social.base.BaseControllerTest;
import com.grad.social.common.security.AuthService;
import com.grad.social.repository.user.UserRepository;
import com.grad.social.testdata.user.UserTestDate;
import org.junit.jupiter.api.ClassOrderer;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestClassOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@TestClassOrder(value = ClassOrderer.OrderAnnotation.class)
class UserControllerTest extends BaseControllerTest {
    public static final String BASE_URI = "/api/users";

    @Autowired
    private UserRepository userRepository;

    @MockitoBean
    private AuthService authService;

    @Nested
    @Order(1)
    @WithAnonymousUser
    class CreateUser {
        @Test
        void whenValidSignupRequest_thenReturns201() throws Exception {
            // given
            CreateUserDto dto = UserTestDate.validCreateUserDto();

            // when
            mockMvc.perform(post(BASE_URI)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isCreated());
        }

        @Test
        void whenDuplicateEmail_thenReturns409() throws Exception {
            // given
            CreateUserDto dto = UserTestDate.validCreateUserDto();

            // when
            // First request to insert user
            mockMvc.perform(post(BASE_URI)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isCreated());

            // Second request with the same email should fail
            mockMvc.perform(post(BASE_URI)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isConflict());
        }

        @Test
        void whenInvalidFields_thenReturns400() throws Exception {
            // given
            CreateUserDto invalidRequest = UserTestDate.invalidCreateUserDto();

            // when
            mockMvc.perform(post(BASE_URI)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(invalidRequest)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @WithMockUser(username = "user123", password = "password123_123")
        void whenUnauthorized_thenReturns403() throws Exception {
            // given
            CreateUserDto invalidRequest = UserTestDate.validCreateUserDto();

            // when
            mockMvc.perform(post(BASE_URI)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(invalidRequest)))
                    .andExpect(status().isCreated());
        }

    }

}

