package com.grad.social.model;

import java.time.LocalDate;

public record SeekRequest(LocalDate lastHappenedAt, Long lastUserId) {
}