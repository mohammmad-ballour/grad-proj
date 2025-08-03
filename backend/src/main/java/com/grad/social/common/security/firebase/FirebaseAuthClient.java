package com.grad.social.common.security.firebase;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.grad.grad_proj.generated.api.model.SignInRequestDto;
import com.grad.social.common.AppConstants;
import com.grad.social.repository.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class FirebaseAuthClient {

    private static final String API_KEY_PARAM = "key";
    private static final String INVALID_CREDENTIALS_ERROR = "INVALID_LOGIN_CREDENTIALS";
    private static final String SIGN_IN_BASE_URL = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword";
    private final String webApiKey = AppConstants.FIREBASE_API_KEY;

    private final UserRepository userRepository;
    private final FirebaseAuth firebaseAuth;

    public String login(SignInRequestDto signInRequestDto) {
        // Step 1: Authenticate via Firebase Identity REST API
        FirebaseSignInRequest requestBody = new FirebaseSignInRequest(signInRequestDto.getEmail(), signInRequestDto.getPassword(), true);
        var signInResponse = sendSignInRequest(requestBody);

        // Step 2: Verify idToken and extract UID
        FirebaseToken decodedToken;
        try {
            decodedToken = this.firebaseAuth.verifyIdToken(signInResponse.idToken());
        } catch (FirebaseAuthException e) {
            throw new IllegalStateException("Failed to verify ID token", e);
        }
        String uid = decodedToken.getUid();

        // Step 3: Add custom claims
        var usernameAndTimezone = this.userRepository.getUsernameAndTimezone(Long.parseLong(uid));
        Map<String, Object> claims = new HashMap<>();
        String timezoneOffset = ZonedDateTime.now(ZoneId.of(usernameAndTimezone.timezoneId())).getOffset().toString();
        claims.put("username", usernameAndTimezone.username());
        claims.put("timezoneOffset", timezoneOffset);

        String customToken;
        try {
            customToken = this.firebaseAuth.createCustomToken(uid, claims);
        } catch (FirebaseAuthException e) {
            throw new IllegalStateException("Failed to create custom token", e);
        }

        return customToken;
    }

    private FirebaseSignInResponse sendSignInRequest(FirebaseSignInRequest firebaseSignInRequest) {
        try {
            return RestClient.create(SIGN_IN_BASE_URL)
                    .post()
                    .uri(uriBuilder -> uriBuilder
                            .queryParam(API_KEY_PARAM, webApiKey)
                            .build())
                    .body(firebaseSignInRequest)
                    .contentType(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .body(FirebaseSignInResponse.class);
        } catch (HttpClientErrorException exception) {
            if (exception.getResponseBodyAsString().contains(INVALID_CREDENTIALS_ERROR)) {
                throw new BadCredentialsException("Invalid login credentials provided");
            }
            throw exception;
        }
    }

    record FirebaseSignInRequest(String email, String password, boolean returnSecureToken) {}
    record FirebaseSignInResponse(String idToken, String refreshToken) {}
}