package com.grad.social.model.status.helper;

import com.grad.social.model.enums.StatusAudience;
import com.grad.social.model.enums.StatusPrivacy;

public record StatusMetadata(StatusPrivacy statusPrivacy, StatusAudience replyAudience, StatusAudience shareAudience) {
}
