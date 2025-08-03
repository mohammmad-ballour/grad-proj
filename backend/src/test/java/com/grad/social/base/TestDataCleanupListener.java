package com.grad.social.base;

import com.grad.social.repository.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.test.context.event.AfterTestMethodEvent;

@Component
@RequiredArgsConstructor
public class TestDataCleanupListener {
    private final UserRepository userRepository;

    @EventListener(AfterTestMethodEvent.class)
    public void cleanTestData(AfterTestMethodEvent event) {
        userRepository.deleteAll();
    }

}