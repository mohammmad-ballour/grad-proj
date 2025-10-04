package com.grad.social.model.status.request;

import com.grad.social.model.enums.ParentAssociation;
import com.grad.social.model.enums.StatusAudience;
import com.grad.social.model.enums.StatusPrivacy;

import java.util.List;

public record CreateStatusRequest(String content, StatusPrivacy privacy, StatusAudience replyAudience,
                                  StatusAudience shareAudience, ParentStatus parentStatus) {
    public record ParentStatus(String statusId, Long statusOwnerId, ParentAssociation parentAssociation) {
    }
}