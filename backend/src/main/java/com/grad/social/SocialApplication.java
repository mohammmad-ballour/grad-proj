package com.grad.social;

import com.grad.social.common.security.UserKey;
import com.grad.social.common.security.keycloak.KeycloakUserService;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.util.Map;

@SpringBootApplication
public class SocialApplication {

    public static void main(String[] args) {
        SpringApplication.run(SocialApplication.class, args);
    }

    @Bean
    ApplicationRunner applicationRunner(KeycloakUserService keycloakUserService) {
        return args -> {
            try {
                keycloakUserService.createUserAccount("1", "test@gmail.com", "testusername", "secret12_12", Map.of(UserKey.TIMEZONE_ID, "Europe/London"));
                keycloakUserService.createUserAccount("2", "test2@gmail.com", "testusername2", "secret12_12", Map.of(UserKey.TIMEZONE_ID, "Asia/Jerusalem"));
            } catch (Exception e) {

            }
        };
    }

}
