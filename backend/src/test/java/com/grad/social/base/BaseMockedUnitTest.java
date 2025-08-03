package com.grad.social.base;

import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@TestInstance(value = TestInstance.Lifecycle.PER_METHOD)
public abstract class BaseMockedUnitTest {
}
