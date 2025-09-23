package com.grad.social.model.status.response;

import com.grad.social.model.enums.ParentAssociation;

public record StatusAssociation(Long parentStatusId, ParentAssociation parentAssociation) {
}