package com.grad.social;

import com.grad.social.common.messaging.redis.RedisConstants;
import com.grad.social.common.security.UserKey;
import com.grad.social.common.security.keycloak.KeycloakUserService;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.data.redis.core.RedisTemplate;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;

@SpringBootApplication
public class SocialApplication {

    public static void main(String[] args) {
        SpringApplication.run(SocialApplication.class, args);
    }

    @Bean
    ApplicationRunner applicationRunner(KeycloakUserService keycloakUserService, RedisTemplate<String, String> redisTemplate) {
        return args -> {
            try {
                keycloakUserService.createUserAccount("1", "mohbalor@gmail.com", "mohbalor", "secret12_12", Map.of(UserKey.TIMEZONE_ID, "Africa/Cairo"));
                keycloakUserService.createUserAccount("2", "mshukur@gmail.com", "mshukur", "secret12_12", Map.of(UserKey.TIMEZONE_ID, "Asia/Jerusalem"));
                keycloakUserService.createUserAccount("3", "baraa@gmail.com", "baraa", "secret12_12", Map.of(UserKey.TIMEZONE_ID, "Asia/Jerusalem"));
                keycloakUserService.createUserAccount("4", "sarahhhh@gmail.com", "sarah", "secret12_12", Map.of(UserKey.TIMEZONE_ID, "Asia/Jerusalem"));
                keycloakUserService.createUserAccount("5", "lucy@gmail.com", "lucy", "secret12_12", Map.of(UserKey.TIMEZONE_ID, "Europe/Berlin"));
            } catch (Exception e) {

            }
            // users 1, 2 and 4 are online
            redisTemplate.opsForSet().add("user:sessions:1", "session-1.1", "session-1.2");
            redisTemplate.opsForSet().add("user:sessions:2", "session-2");
            redisTemplate.opsForSet().add("user:sessions:4", "session-4");

            // users 3 and 5 are offline
            redisTemplate.opsForHash().put("user:meta:3", RedisConstants.LAST_ONLINE_HASH_KEY, Instant.now().minus(15, ChronoUnit.MINUTES).toString());
            redisTemplate.opsForHash().put("user:meta:5", RedisConstants.LAST_ONLINE_HASH_KEY, Instant.now().minus(2, ChronoUnit.DAYS).toString());
        };
    }

}
