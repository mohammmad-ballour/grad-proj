package com.grad.social.model.status.response;

public record StatusMediaResponse(Long statusId, Long mediaId, String mimeType, long sizeInBytes) {
}