package com.grad.social.service.status.event;

public record StatusContentUpdatedEvent(Long statusId, String oldContent, String newContent) {
}