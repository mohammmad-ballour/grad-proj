package com.grad.social.common.security.keycloak;

import com.grad.grad_proj.generated.api.model.SignInRequestDto;
import com.grad.social.common.security.AuthService;
import jakarta.ws.rs.core.Response;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.CreatedResponseUtil;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
@Primary
public class KeycloakUserService implements AuthService {
    private final Keycloak keycloak;

    @Value("${keycloak.realm}")
    private String realm;
    @Value("${keycloak.client-id}")
    private String clientId;
    @Value("${keycloak.client-secret}")
    private String clientSecret;

    // In keyclaok, username is email address
    @Override
    public String createUserAccount(String userId, String email, String username, String password) {
        UserRepresentation userRepresentation = new UserRepresentation();
        userRepresentation.setEnabled(true);
        userRepresentation.setUsername(email);
        userRepresentation.setEmail(email);
        userRepresentation.setEmailVerified(true);        //FIXME

        Map<String, List<String>> attrs = new HashMap<>();
        String timezoneOffset = ZonedDateTime.now(ZoneId.of("Europe/Berlin")).getOffset().toString();

        attrs.put("uid", List.of(userId));  // Postgres ID
        attrs.put("timezone_offset", List.of(timezoneOffset));
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

//        var usersResource = getUsersResource();
//        List<UserRepresentation> userRepresentations = usersResource.searchByUsername(newUserRecord.username(), true);
//        UserRepresentation userRepresentation1 = userRepresentations.get(0);
//        sendVerificationEmail(userRepresentation1.getId());

        return newUserId;
    }

    @Override
    public String loginWithPassword(SignInRequestDto request) throws BadCredentialsException {
        return loginWithPassword(request.getEmail(), request.getPassword());
    }

    public String loginWithPassword(String username, String password) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("client_id", clientId);
        form.add("client_secret", clientSecret);
        form.add("grant_type", "password");
        form.add("username", username);
        form.add("password", password);

        RestClient restClient = RestClient.create();

        System.out.println("Realm " + realm);
        System.out.println("Client id " + clientId);
        System.out.println("Client secret " + clientSecret);

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
