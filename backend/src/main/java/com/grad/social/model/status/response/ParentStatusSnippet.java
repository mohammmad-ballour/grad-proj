package com.grad.social.model.status.response;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import com.grad.social.model.enums.StatusPrivacy;
import com.grad.social.model.shared.UserAvatar;

import java.time.Instant;
import java.util.List;

public record ParentStatusSnippet(UserAvatar parentUserAvatar,
                                  @JsonSerialize(using = ToStringSerializer.class) Long parentStatusId,
                                  String content, StatusPrivacy privacy, Instant postedAt,
                                  List<MediaResponse> medias) {
}