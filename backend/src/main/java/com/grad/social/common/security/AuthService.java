package com.grad.social.common.security;

import com.grad.grad_proj.generated.api.model.SignInRequestDto;
import org.springframework.security.authentication.BadCredentialsException;

public interface AuthService {
    String createUserAccount(String userId, String email, String password);

    /**
     * Authenticates a user using their email and password credentials.
     *
     * <p>This method verifies the user's credentials and returns an ID token (JWT) if the authentication is successful.</p>
     *
     * @param request a {@link SignInRequestDto} containing the user's email and password
     * @return an ID token (JWT) as a {@link String}
     * @throws BadCredentialsException if the credentials are invalid
     */
    String loginWithPassword(SignInRequestDto request) throws BadCredentialsException;
}
