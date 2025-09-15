package com.grad.social.model.status.response;

public record MediaResponse(Long mediaId, String mediaUrl, String mimeType, long sizeInBytes, int position) {

}