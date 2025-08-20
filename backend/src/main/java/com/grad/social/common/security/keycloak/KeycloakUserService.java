package com.grad.social.common.security.keycloak;

import com.grad.grad_proj.generated.api.model.SignInRequestDto;
import com.grad.social.common.security.AuthService;
import com.grad.social.common.security.UserKey;
import com.grad.social.common.security.event.LoginSuccessEvent;
import jakarta.ws.rs.core.Response;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.CreatedResponseUtil;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
@Primary
public class KeycloakUserService implements AuthService {
    private final Keycloak keycloak;
    private final ApplicationEventPublisher eventPublisher;

    @Value("${keycloak.realm}")
    private String realm;
    @Value("${keycloak.client-id}")
    private String clientId;
    @Value("${keycloak.client-secret}")
    private String clientSecret;

    @Override
    public String createUserAccount(String userId, String email, String username, String password, Map<UserKey, Object> customFields) {
        UserRepresentation userRepresentation = new UserRepresentation();
        userRepresentation.setEnabled(true);
        userRepresentation.setUsername(username);
        userRepresentation.setEmail(email);
        userRepresentation.setEmailVerified(true);        //FIXME

        Map<String, List<String>> attrs = new HashMap<>();
        attrs.put("uid", List.of(userId));  // Postgres ID
        attrs.put(UserKey.TIMEZONE_ID.name().toLowerCase(), List.of(customFields.get(UserKey.TIMEZONE_ID).toString()));    // Timezone ID
        userRepresentation.setAttributes(attrs);

        // Create the userRepresentation
        Response response = keycloak.realm(realm)
                .users()
                .create(userRepresentation);

        if (response.getStatus() != 201) {
            throw new RuntimeException("Failed to create userRepresentation in Keycloak: " + response.getStatus());
        }

        log.info("New userRepresentation has bee created");


        // Get ID of created userRepresentation
        String newUserId = CreatedResponseUtil.getCreatedId(response);

        // Set password
        CredentialRepresentation passwordCred = new CredentialRepresentation();
        passwordCred.setTemporary(false);
        passwordCred.setType(CredentialRepresentation.PASSWORD);
        passwordCred.setValue(password);

        keycloak.realm(realm)
                .users()
                .get(newUserId)
                .resetPassword(passwordCred);
        return newUserId;
    }

    @Override
    public void updateUserAccount(String username, Map<UserKey, Object> fieldsToUpdate) {
        UserRepresentation user = keycloak.realm(realm).users().searchByUsername(username, true).get(0);
        Map<String, List<String>> attributes = user.getAttributes();
        if (attributes == null) {
            attributes = new HashMap<>();
        }
        for(var entry : fieldsToUpdate.entrySet()) {
            attributes.put(entry.getKey().name().toLowerCase(), List.of(entry.getValue().toString()));
        }
        user.setAttributes(attributes);
        keycloak.realm(realm).users().get(user.getId()).update(user);

    }

    @Override
    public String loginWithPassword(SignInRequestDto request) throws BadCredentialsException {
        var token = loginWithPassword(request.getEmail(), request.getPassword());
        if (token != null) {
            this.eventPublisher.publishEvent(new LoginSuccessEvent(token));
        }
        return token;
    }

    public String loginWithPassword(String username, String password) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("client_id", clientId);
        form.add("client_secret", clientSecret);
        form.add("grant_type", "password");
        form.add("username", username);
        form.add("password", password);

        RestClient restClient = RestClient.create();
        Map<String, Object> response = restClient.post()
                .uri("http://localhost:9090/realms/" + realm + "/protocol/openid-connect/token")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .body(Map.class);

        return (String) response.get("access_token");
    }

    public void sendVerificationEmail(String userId) {
        getUser(userId).sendVerifyEmail();
    }

    public void deleteUser(String userId) {
        keycloak.realm(realm).users().delete(userId);
    }

    public void forgotPassword(String email) {
        List<UserRepresentation> userRepresentations = keycloak.realm(realm).users().searchByEmail(email, true);
        UserRepresentation userRepresentation1 = userRepresentations.get(0);
        UserResource userResource = getUser(userRepresentation1.getId());
        userResource.executeActionsEmail(List.of("UPDATE_PASSWORD"));
    }

    private UserResource getUser(String userId) {
        return keycloak.realm(realm).users().get(userId);
    }
}
