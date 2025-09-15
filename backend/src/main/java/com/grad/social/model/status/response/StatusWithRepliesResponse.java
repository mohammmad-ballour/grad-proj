package com.grad.social.model.status.response;

import java.util.List;

public record StatusWithRepliesResponse(StatusResponse statusResponse, List<ReplySnippet> replies) {

}