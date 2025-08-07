package com.grad.social.model;

import java.time.temporal.Temporal;

public record SeekRequest(Temporal lastHappenedAt, Long lastEntityId) {
}