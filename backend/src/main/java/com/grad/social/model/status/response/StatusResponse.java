package com.grad.social.model.status.response;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import com.grad.social.model.enums.ParentAssociation;
import com.grad.social.model.enums.StatusAudience;
import com.grad.social.model.enums.StatusPrivacy;
import com.grad.social.model.shared.UserAvatar;

import java.time.Instant;
import java.util.List;

public record StatusResponse(UserAvatar userAvatar, @JsonSerialize(using = ToStringSerializer.class) Long statusId,
                             String content, boolean isPinned, StatusPrivacy privacy, StatusAudience replyAudience,
                             boolean isCurrentUserAllowedToReply, StatusAudience shareAudience,
                             boolean isCurrentUserAllowedToShare, boolean isSavedToBookmarks,
                             List<String> mentionedUsers, Instant postedAt, boolean isStatusLikedByCurrentUser,
                             int numLikes, int numReplies, int numShares, List<MediaResponse> medias,
                             ParentAssociation parentAssociation, ParentStatusSnippet parentStatusSnippet) {

}