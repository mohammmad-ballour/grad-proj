package com.grad.social;

import com.grad.social.common.security.keycloak.KeycloakUserService;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class SocialApplication {

    public static void main(String[] args) {
        SpringApplication.run(SocialApplication.class, args);
    }

    @Bean
    ApplicationRunner applicationRunner(KeycloakUserService keycloakUserService) {
        return args -> {
            var uid= "27";
            var email =  "mohammaballour72@gmail.com";
            var username = "jlong";
            var password = "secret12_12";
            var timezoneId = "Europe/London";
//            keycloakUserService.createUserAccount(uid, email, username, password);
            System.out.println("User created");
            System.out.println("*************************************");
//            String token = keycloakUserService.loginWithPassword(email, password);
//            System.out.println(token);
        };
    }

}
