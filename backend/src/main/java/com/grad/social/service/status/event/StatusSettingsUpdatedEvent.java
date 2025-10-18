package com.grad.social.service.status.event;

import com.grad.social.model.enums.StatusPrivacy;

public record StatusSettingsUpdatedEvent(Long statusId, StatusPrivacy newPrivacy) {
}