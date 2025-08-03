package com.grad.social.common.security;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

import com.grad.social.common.AppConstants;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.filter.OncePerRequestFilter;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class AuthFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";
    private static final String USER_ID_CLAIM = "user_id";
    private static final String AUTHORIZATION_HEADER = "Authorization";

    private final FirebaseAuth firebaseAuth;
    private final ObjectMapper objectMapper;

    public AuthFilter(FirebaseAuth firebaseAuth, ObjectMapper objectMapper) {
        this.firebaseAuth = firebaseAuth;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws IOException, ServletException {
        String authorizationHeader = request.getHeader(AUTHORIZATION_HEADER);

        if (authorizationHeader != null && authorizationHeader.startsWith(BEARER_PREFIX)) {
            String token = authorizationHeader.replace(BEARER_PREFIX, "");
            Optional<String> userId = extractUserIdFromToken(token);

            if (userId.isPresent()) {
                var authentication = new UsernamePasswordAuthenticationToken(new CurrentUser(Long.parseLong(userId.get())), null, null);
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } else {
                setAuthErrorDetails(response);
                return;
            }
        } else {
            // ✅ Anonymous fallback with user ID -1
            var anonymousUser = new CurrentUser(-1L);
            var anonymousAuth = new UsernamePasswordAuthenticationToken(anonymousUser, null, List.of());
            anonymousAuth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(anonymousAuth);
        }
        filterChain.doFilter(request, response);
    }

    private Optional<String> extractUserIdFromToken(String token) {
        try {
            FirebaseToken firebaseToken = firebaseAuth.verifyIdToken(exchangeCustomTokenForIdToken(token), true);
            String userId = String.valueOf(firebaseToken.getClaims().get(USER_ID_CLAIM));
            return Optional.of(userId);
        } catch (FirebaseAuthException exception) {
            System.out.println(exception.getMessage());
            return Optional.empty();
        }
    }

    private void setAuthErrorDetails(HttpServletResponse response) throws JsonProcessingException, IOException {
        HttpStatus unauthorized = HttpStatus.UNAUTHORIZED;
        response.setStatus(unauthorized.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(unauthorized, "Authentication failure: Token missing, invalid or expired");
        response.getWriter().write(objectMapper.writeValueAsString(problemDetail));
    }

    public String exchangeCustomTokenForIdToken(String customToken) {
        var request = new FirebaseCustomTokenExchangeRequest(customToken, true);

        return RestClient.create("https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken")
                .post()
                .uri(uriBuilder -> uriBuilder
                        .queryParam("key", AppConstants.FIREBASE_API_KEY)
                        .build())
                .body(request)
                .contentType(MediaType.APPLICATION_JSON)
                .retrieve()
                .body(FirebaseCustomTokenExchangeResponse.class)
                .idToken();
    }

    record FirebaseCustomTokenExchangeRequest(String token, boolean returnSecureToken) {
    }

    record FirebaseCustomTokenExchangeResponse(String idToken, String refreshToken, String expiresIn) {
    }

}