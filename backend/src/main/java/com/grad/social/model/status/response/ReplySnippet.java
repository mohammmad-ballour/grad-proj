package com.grad.social.model.status.response;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import com.grad.social.model.shared.UserAvatar;

import java.time.Instant;
import java.util.List;

public record ReplySnippet(@JsonSerialize(using = ToStringSerializer.class ) Long replyId, String content, Instant postedAt, UserAvatar user, int numLikes,
                           int numReplies, int numShares, boolean isLikedByCurrentUser, boolean isSavedToBookmarks,
                           List<MediaResponse> medias
) {
}