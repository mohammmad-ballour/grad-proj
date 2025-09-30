package com.grad.social.model.status.response;

import java.time.Instant;

public record StatusMediaResponse(Long statusId, Instant postedAt, Long mediaId, String mimeType, long sizeInBytes, int position) {
}