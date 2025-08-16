package com.grad.social.service.chat;

import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.security.authentication.event.LogoutSuccessEvent;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.*;

@Component
@RequiredArgsConstructor
public class UserOnlineStatusListener {

    private final RedisTemplate<String, String> redisTemplate;

    // We’ll use this scheduler to wait a few seconds before updating last_online_at, and cancel that offline marking if they reconnect within the delay.
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
    // Map to keep track of scheduled offline tasks
    private final Map<String, ScheduledFuture<?>> offlineTasks = new ConcurrentHashMap<>();

    // Offline threshold in seconds before considering it a "new login"
    private static final long LOGIN_THRESHOLD_SECONDS = 300; // 5 minutes
    // Delay before marking offline to avoid false positives
    private static final long OFFLINE_DELAY_SECONDS = 10; // 10 seconds

//    @EventListener
//    public void onLogin(AuthenticationSuccessEvent event) {
//        System.out.println("in login success");
//        String userId = extractUserId(event.getAuthentication());
//        if (userId != null) {
//            String sessionId = RequestContextHolder.getRequestAttributes().getSessionId();
//            System.out.println("Session id after login = " + sessionId);
//            redisTemplate.opsForSet().add(userKey(userId), sessionId);
//        }
//    }

    @EventListener
    public void onLogout(LogoutSuccessEvent event) {
        System.out.println("in logout success");
        String userId = extractUserId(event.getAuthentication());
        if (userId != null) {
            String sessionId = RequestContextHolder.getRequestAttributes().getSessionId();
            System.out.println("Session id after logout = " + sessionId);
            redisTemplate.opsForSet().remove(userSessionsKey(userId), sessionId);
            if (!isUserOnline(userId)) {
                redisTemplate.delete(userSessionsKey(userId)); // cleanup
            }
        }
    }

    @EventListener
    public void handleWebSocketConnect(SessionConnectEvent event) {
        var accessor = SimpMessageHeaderAccessor.wrap(event.getMessage());
        String userId = extractUserId((Authentication) event.getUser());
        if (userId != null) {
            String sessionId = accessor.getSessionId();

            // Cancel any pending "offline" marking
            ScheduledFuture<?> pendingTask = offlineTasks.remove(userId);
            if (pendingTask != null) {
                pendingTask.cancel(false);
            }

            redisTemplate.opsForSet().add(userSessionsKey(userId), sessionId);

            Long sessionCount = redisTemplate.opsForSet().size(userSessionsKey(userId));
            if (sessionCount != null && sessionCount == 1) {
                boolean shouldUpdateLogin = true;

                // Check last_online_at from Redis
                Object lastOnlineObj = redisTemplate.opsForHash().get(userMetaKey(userId), "last_online_at");
                if (lastOnlineObj != null) {
                    Instant lastOnline = Instant.parse(lastOnlineObj.toString());
                    long secondsSinceLastOnline = Duration.between(lastOnline, Instant.now()).toSeconds();
                    if (secondsSinceLastOnline < LOGIN_THRESHOLD_SECONDS) {
                        shouldUpdateLogin = false;
                    }
                }

                // If this is the *first* session, store login time
                if (shouldUpdateLogin) {
                    redisTemplate.opsForHash().put(userMetaKey(userId), "last_login_at", Instant.now().toString());
                }
            }

            System.out.println("Connected: userId=" + userId + ", sessionId=" + sessionId);
        }
    }

    @EventListener
    public void handleWebSocketDisconnect(SessionDisconnectEvent event) {
        var accessor = SimpMessageHeaderAccessor.wrap(event.getMessage());
        String userId = extractUserId((Authentication) event.getUser());
        if (userId != null) {
            String sessionId = accessor.getSessionId();

            redisTemplate.opsForSet().remove(userSessionsKey(userId), sessionId);

            Long remainingSessions = redisTemplate.opsForSet().size(userSessionsKey(userId));
            if (remainingSessions != null && remainingSessions == 0) {
                // Schedule delayed offline update
                ScheduledFuture<?> task = scheduler.schedule(() -> {
                    redisTemplate.opsForHash().put(userMetaKey(userId), "last_online_at", Instant.now().toString());
                    offlineTasks.remove(userId);
                    System.out.println("Marked offline: userId=" + userId);
                }, OFFLINE_DELAY_SECONDS, TimeUnit.SECONDS);

                offlineTasks.put(userId, task);
            }

            System.out.println("Disconnected: userId=" + userId + ", sessionId=" + sessionId);
        }
    }

    private boolean isUserOnline(String userId) {
        Long size = redisTemplate.opsForSet().size(userSessionsKey(userId));
        return size != null && size > 0;
    }

    private String userSessionsKey(String userId) {
        return "user:sessions:" + userId;
    }

    private String userMetaKey(String userId) {
        return "user:meta:" + userId;
    }

    private String extractUserId(Authentication authentication) {
        JwtAuthenticationToken jwtAuthenticationToken = (JwtAuthenticationToken) authentication;
        if (jwtAuthenticationToken == null) {
            return null;
        }
        return jwtAuthenticationToken.getToken().getClaimAsString("uid");
    }
}
