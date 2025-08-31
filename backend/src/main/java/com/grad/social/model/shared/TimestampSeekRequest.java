package com.grad.social.model.shared;

import java.time.Instant;

public record TimestampSeekRequest(Instant lastHappenedAt, Long lastEntityId) {
}