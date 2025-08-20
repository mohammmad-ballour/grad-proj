package com.grad.social.service.chat;

import com.grad.social.common.messaging.redis.RedisConstants;
import com.grad.social.common.security.event.LoginSuccessEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.*;

@Component
@RequiredArgsConstructor
public class UserOnlineStatusListener {

    private final ChattingService chattingService;
    private final RedisTemplate<String, String> redisTemplate;

    // We’ll use this scheduler to wait a few seconds before updating last_online_at, and cancel that offline marking if they reconnect within the delay.
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
    // Map to keep track of scheduled offline tasks
    private final Map<String, ScheduledFuture<?>> offlineTasks = new ConcurrentHashMap<>();
    // Delay before marking offline to avoid false positives
    private static final long OFFLINE_DELAY_SECONDS = 10; // 10 seconds

    @EventListener
    public void onLogin(LoginSuccessEvent event) {
        // confirm messages delivery
        Jwt jwt = Jwt.withTokenValue(event.token()).build();
        JwtAuthenticationToken authentication = new JwtAuthenticationToken(jwt);
        Long userId = Long.parseLong(extractUserId(authentication));
        chattingService.confirmDelivery(userId);

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
                    redisTemplate.opsForHash().put(userMetaKey(userId), RedisConstants.LAST_ONLINE_HASH_KEY, Instant.now().toString());
                    offlineTasks.remove(userId);
                    System.out.println("Marked offline: userId=" + userId);
                }, OFFLINE_DELAY_SECONDS, TimeUnit.SECONDS);

                offlineTasks.put(userId, task);
            }

            System.out.println("Disconnected: userId=" + userId + ", sessionId=" + sessionId);
        }
    }

    private String userSessionsKey(String userId) {
        return RedisConstants.USERS_SESSION_KEY_PREFIX.concat(userId);
    }

    private String userMetaKey(String userId) {
        return RedisConstants.USERS_SESSION_META_PREFIX.concat(userId);
    }

    private String extractUserId(Authentication authentication) {
        JwtAuthenticationToken jwtAuthenticationToken = (JwtAuthenticationToken) authentication;
        if (jwtAuthenticationToken == null) {
            return null;
        }
        return jwtAuthenticationToken.getToken().getClaimAsString("uid");
    }
}
