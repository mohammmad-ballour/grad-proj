package com.grad.social.model.status.response;

import java.util.List;

public record FeedResponse(List<StatusResponse> statuses, int unreadMessagesCount, int unreadNotificationsCount) {
}
