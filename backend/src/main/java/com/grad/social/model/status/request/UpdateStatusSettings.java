package com.grad.social.model.status.request;

import com.grad.social.model.enums.StatusAudience;
import com.grad.social.model.enums.StatusPrivacy;

public record UpdateStatusSettings(StatusPrivacy statusPrivacy, StatusAudience replyAudience, StatusAudience shareAudience) {
}