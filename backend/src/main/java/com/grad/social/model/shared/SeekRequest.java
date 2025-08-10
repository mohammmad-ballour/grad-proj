package com.grad.social.model.shared;

import java.time.Instant;

public record SeekRequest(Instant lastHappenedAt, Long lastEntityId) {
}