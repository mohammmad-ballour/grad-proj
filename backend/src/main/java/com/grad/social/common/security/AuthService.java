package com.grad.social.common.security;

import org.springframework.security.authentication.BadCredentialsException;

import java.util.Map;

public interface AuthService {
    String createUserAccount(String userId, String email, String username, String password, Map<UserKey, Object> customFields);

    void updateUserAccount(String username, Map<UserKey, Object> fieldsToUpdate);

    /**
     * Authenticates a user using their email and password credentials.
     *
     * <p>This method verifies the user's credentials and returns an ID token (JWT) if the authentication is successful.</p>
     *
     * @param request a {@link SignInRequest} containing the user's email and password
     * @return an ID token (JWT) as a {@link String}
     * @throws BadCredentialsException if the credentials are invalid
     */
    String loginWithPassword(SignInRequest request) throws BadCredentialsException;
}
