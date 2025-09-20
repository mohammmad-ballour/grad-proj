package com.grad.social.model.status.response;

import com.grad.social.model.shared.UserAvatar;

import java.time.Instant;
import java.util.List;

public record ReplySnippet(Long replyId, String content, Instant postedAt, UserAvatar user, int numLikes,
                           int numReplies, int numShares,
                           List<MediaResponse> medias
) {
}