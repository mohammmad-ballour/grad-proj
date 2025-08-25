package com.grad.social.model.chat.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

@NoArgsConstructor
@AllArgsConstructor
@Data
public final class MessageDetailResponse {
    private boolean delivered;
    private boolean read;
    private Map<Long, Instant> readByAt;
    private Map<Long, Instant> deliveredByAt;
}