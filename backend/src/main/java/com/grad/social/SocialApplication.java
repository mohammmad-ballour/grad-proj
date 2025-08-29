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
                keycloakUserService.createUserAccount("1", "mohbalor@gmail.com", "mohbalor", "secret12_12", Map.of(UserKey.TIMEZONE_ID, "Africa/Cairo"));
                keycloakUserService.createUserAccount("2", "mshukur@gmail.com", "mshukur", "secret12_12", Map.of(UserKey.TIMEZONE_ID, "Asia/Jerusalem"));
                keycloakUserService.createUserAccount("3", "baraa@gmail.com", "baraa", "secret12_12", Map.of(UserKey.TIMEZONE_ID, "Asia/Jerusalem"));
                keycloakUserService.createUserAccount("4", "sarahhhh@gmail.com", "sarah", "secret12_12", Map.of(UserKey.TIMEZONE_ID, "Asia/Jerusalem"));
                keycloakUserService.createUserAccount("5", "lucy@gmail.com", "lucy", "secret12_12", Map.of(UserKey.TIMEZONE_ID, "Europe/Berlin"));
            } catch (Exception e) {

            }
        };
    }

}
