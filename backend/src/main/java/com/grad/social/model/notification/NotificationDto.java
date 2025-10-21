package com.grad.social.model.notification;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import lombok.Getter;

import java.time.Instant;

public record NotificationDto(
        Long id,
        String type,
        Long recipientId,
        @JsonSerialize(using = ToStringSerializer.class)   Long statusId,
        Instant lastUpdatedAt,
        Integer actorCount,
        GroupingState groupingState,
        String[] actorDisplayNames,
        String lastActorUsername,
        byte[] lastActorProfilePicture,
        // null (not a user-status notification), empty string (media-only status), otherwise the status's content
        String statusContent
) {
    @Getter
    public enum GroupingState {
        UNREAD_YET, HAS_NEW_ACTIVITY, READ;
    }
}
