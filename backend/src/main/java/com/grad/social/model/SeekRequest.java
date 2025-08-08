package com.grad.social.model;

import java.time.Instant;

public record SeekRequest(Instant lastHappenedAt, Long lastEntityId) {
}