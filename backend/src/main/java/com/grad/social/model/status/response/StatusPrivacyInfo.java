package com.grad.social.model.status.response;

import com.grad.social.model.enums.StatusAudience;
import com.grad.social.model.enums.StatusPrivacy;

public record StatusPrivacyInfo(Long statusOwnerId, StatusPrivacy privacy, StatusAudience replyAudience, StatusAudience shareAudience) {
}