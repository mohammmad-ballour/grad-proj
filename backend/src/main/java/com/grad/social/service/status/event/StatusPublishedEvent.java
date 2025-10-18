package com.grad.social.service.status.event;

public record StatusPublishedEvent(Long statusId, String content) {
}