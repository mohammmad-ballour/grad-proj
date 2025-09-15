package com.grad.social.repository.user;

import com.grad.social.common.AppConstants;
import com.grad.social.model.enums.ParentAssociation;
import com.grad.social.model.enums.StatusAudience;
import com.grad.social.model.enums.StatusPrivacy;
import com.grad.social.model.shared.UserAvatar;
import com.grad.social.model.status.response.*;
import com.grad.social.model.tables.*;
import com.grad.social.service.status.utils.StatusUtils;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.jooq.Field;
import org.jooq.Record;
import org.jooq.SelectOnConditionStep;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import static org.jooq.impl.DSL.row;
import static org.jooq.impl.DSL.when;

@Repository
@RequiredArgsConstructor
public class UserStatusInteractionRepository {
    private final DSLContext dsl;

    // Aliases
    Statuses s = Statuses.STATUSES.as("s");
    Statuses sp = Statuses.STATUSES.as("sp");  // parent status
    Statuses sc = Statuses.STATUSES.as("sc"); // count replies and shares for original status
    Statuses sc_reply = Statuses.STATUSES.as("sc_reply"); // count replies and shares for child statuses (replies)

    StatusLikes sl = StatusLikes.STATUS_LIKES.as("sl");
    StatusLikes sl2 = StatusLikes.STATUS_LIKES.as("sl2");

    StatusMedia sm = StatusMedia.STATUS_MEDIA.as("sm");
    StatusMedia sm2 = StatusMedia.STATUS_MEDIA.as("sm2");
    StatusMedia sm_reply = StatusMedia.STATUS_MEDIA.as("sm_reply");

    MediaAsset ma = MediaAsset.MEDIA_ASSET.as("ma");
    MediaAsset ma2 = MediaAsset.MEDIA_ASSET.as("ma2");
    MediaAsset ma_reply = MediaAsset.MEDIA_ASSET.as("ma_reply");

    Users u = Users.USERS.as("u");
    Users u2 = Users.USERS.as("u2");
    Users u_reply = Users.USERS.as("u_reply");

    UserFollowers uf = UserFollowers.USER_FOLLOWERS.as("uf");
    UserFollowers uf2 = UserFollowers.USER_FOLLOWERS.as("uf2");
    UserMutes um = UserMutes.USER_MUTES.as("um");
    UserBlocks ub = UserBlocks.USER_BLOCKS.as("ub");

    // currentUserId is the one who is viewing the status
    public StatusWithRepliesResponse getStatusById(Long currentUserId, Long statusIdToFetch) {
        // blocks: neither direction (current user blocked poster or poster blocked current user)
        var notBlockedPredicate = DSL.notExists(
                DSL.selectOne()
                        .from(ub)
                        .where(ub.USER_ID.eq(currentUserId).and(ub.BLOCKED_USER_ID.eq(s.USER_ID))
                                .or(ub.USER_ID.eq(s.USER_ID).and(ub.BLOCKED_USER_ID.eq(currentUserId))))
        );

        // Privacy predicate: allow if: own post, PUBLIC, FOLLOWERS and (current user follows poster)
        var privacyPredicate =
                s.USER_ID.eq(currentUserId)
                        .or(s.PRIVACY.eq(StatusPrivacy.PUBLIC))
                        // check that the current user follows the poster
                        .or(s.PRIVACY.eq(StatusPrivacy.FOLLOWERS).and(uf.FOLLOWER_ID.eq(currentUserId)));

        // MULTISET field for media: load actual bytes from storage in converter
        Field<List<MediaResponse>> mediasField = loadStatusMedia(ma, sm, s);
        Field<List<MediaResponse>> parentMediasField = loadStatusMedia(ma2, sm2, sp);

        // MULTISET of replies with content + counts
        Field<List<ReplySnippet>> repliesField = DSL.multiset(
                        DSL.select(
                                        sc.ID.as("reply_id"),
                                        sc.CONTENT.as("content"),
                                        sc.CREATED_AT.as("created_at"),
                                        row(
                                                u_reply.ID, u_reply.USERNAME, u_reply.DISPLAY_NAME, u_reply.PROFILE_PICTURE
                                        ).mapping(UserAvatar::new).as("user"),
                                        DSL.coalesce(DSL.countDistinct(sl2.USER_ID), 0).as("num_likes"),
                                        DSL.coalesce(DSL.countDistinct(
                                                DSL.when(sc_reply.PARENT_ASSOCIATION.eq(ParentAssociation.REPLY), sc_reply.ID)
                                        ), 0).as("num_replies"),
                                        // nested medias multiset for this reply
                                        loadStatusMedia(ma_reply, sm_reply, sc).as("medias")
                                )
                                .from(sc)
                                .leftJoin(u_reply).on(u_reply.ID.eq(sc.USER_ID))
                                .leftJoin(sl2).on(sl2.STATUS_ID.eq(sc.ID))   // likes of reply
                                .leftJoin(sc_reply).on(sc_reply.PARENT_STATUS_ID.eq(sc.ID)) // replies of reply
                                .where(sc.PARENT_STATUS_ID.eq(s.ID))
                                .and(sc.PARENT_ASSOCIATION.eq(ParentAssociation.REPLY))
                                .groupBy(sc.ID, u_reply.ID)
                                .orderBy(sc.CREATED_AT.desc())
                                .limit(AppConstants.DEFAULT_PAGE_SIZE)
                ).convertFrom(r ->
                        r.map(rec -> new ReplySnippet(
                                rec.get("reply_id", Long.class),
                                rec.get("content", String.class),
                                rec.get("created_at", Instant.class),
                                rec.get("user", UserAvatar.class),
                                rec.get("num_likes", Integer.class),
                                rec.get("num_replies", Integer.class),
                                rec.get("medias", List.class)
                        ))
                )
                .as("replies");

        Record record = dsl.selectDistinct(s.ID.as("id"), s.CONTENT.as("content"), s.PRIVACY.as("privacy"), s.REPLY_AUDIENCE, s.SHARE_AUDIENCE, s.CREATED_AT.as("posted_at"),
                        s.USER_ID.as("owner_id"), u.USERNAME.as("username"), u.DISPLAY_NAME.as("display_name"), u.PROFILE_PICTURE.as("profile_picture"),
                        DSL.when(uf.FOLLOWER_ID.isNotNull(), true).otherwise(false).as("is_status_owner_followed_by_current_user"),
                        DSL.coalesce(DSL.countDistinct(sl.USER_ID), 0).as("num_likes"),
                        DSL.coalesce(DSL.countDistinct(
                                DSL.when(sc.PARENT_ASSOCIATION.eq(ParentAssociation.REPLY), sc.ID)
                        ), 0).as("num_replies"),
                        DSL.coalesce(DSL.countDistinct(
                                DSL.when(sc.PARENT_ASSOCIATION.eq(ParentAssociation.SHARE), sc.ID)
                        ), 0).as("num_shares"), mediasField.as("medias"),
                        DSL.when(uf2.FOLLOWER_ID.isNotNull(), true).otherwise(false).as("is_parent_status_owner_followed_by_current_user"),
                        u2.ID.as("parent_owner_id"), u2.USERNAME.as("parent_username"), u2.DISPLAY_NAME.as("parent_display_name"), u2.PROFILE_PICTURE.as("parent_profile_picture"),
                        sp.ID.as("parent_id"), sp.CONTENT.as("parent_content"), sp.PRIVACY.as("parent_privacy"), sp.CREATED_AT.as("parent_posted_at"),
                        parentMediasField.as("parent_medias")
                        , repliesField)
                .from(s)
                // join the poster user (to get display name/picture)
                .leftJoin(u).on(u.ID.eq(s.USER_ID))
                .leftJoin(sp).on(s.PARENT_STATUS_ID.eq(sp.ID))
                .leftJoin(u2).on(u2.ID.eq(sp.USER_ID))
                // join followers only to allow 'FOLLOWERS' privacy checks and to restrict feed to followed users
                .leftJoin(uf).on(uf.FOLLOWED_USER_ID.eq(s.USER_ID).and(uf.FOLLOWER_ID.eq(currentUserId)))
                .leftJoin(uf2).on(uf2.FOLLOWED_USER_ID.eq(sp.USER_ID).and(uf2.FOLLOWER_ID.eq(currentUserId)))
                // join to aggregate likes
                .leftJoin(sl).on(sl.STATUS_ID.eq(s.ID))
                .leftJoin(sc).on(sc.PARENT_STATUS_ID.eq(s.ID))
                .where(notBlockedPredicate)
                .and(privacyPredicate)
                .and(s.ID.eq(statusIdToFetch))
                .groupBy(s.ID, u.ID, u2.ID, sp.ID, uf.FOLLOWER_ID, uf2.FOLLOWER_ID)
                .orderBy(s.CREATED_AT.desc())
                .fetchOne();

        return this.mapToStatusWithRepliesResponse(record);
    }


    // Helpers
    public List<String> validUsernamesInUsernames(List<String> mentionedUsernames) {
        return dsl.select(u.USERNAME)
                .from(u)
                .where(u.USERNAME.in(mentionedUsernames))
                .fetchInto(String.class);
    }

    private StatusWithRepliesResponse mapToStatusWithRepliesResponse(Record record) {
        if (record == null) {
            return null;
        }

        // Extract all fields manually
        Long statusId = record.get("id", Long.class);
        String content = record.get("content", String.class);
        StatusPrivacy privacy = record.get("privacy", StatusPrivacy.class);
        StatusAudience replyAudience = record.get("reply_audience", StatusAudience.class);
        StatusAudience shareAudience = record.get("share_audience", StatusAudience.class);
        Instant postedAt = record.get("posted_at", Instant.class);

        Long statusOwnerId = record.get("owner_id", Long.class);
        String username = record.get("username", String.class);
        String displayName = record.get("display_name", String.class);
        byte[] profilePicture = record.get("profile_picture", byte[].class);

        Integer numLikes = record.get("num_likes", Integer.class);
        Integer numReplies = record.get("num_replies", Integer.class);
        Integer numShares = record.get("num_shares", Integer.class);

        List<MediaResponse> medias = record.get("medias", List.class);

        Long parentOwnerId = record.get("parent_owner_id", Long.class);
        String parentUsername = record.get("parent_username", String.class);
        String parentDisplayName = record.get("parent_display_name", String.class);
        byte[] parentProfilePicture = record.get("parent_profile_picture", byte[].class);

        Long parentStatusId = record.get("parent_id", Long.class);
        String parentStatusContent = record.get("parent_content", String.class);
        StatusPrivacy parentStatusPrivacy = record.get("parent_privacy", StatusPrivacy.class);
        Instant parentPostedAt = record.get("parent_posted_at", Instant.class);
        List<MediaResponse> parentMedias = record.get("parent_medias", List.class);

        // Extract mentions
        List<String> mentions = StatusUtils.extractMentions(content);
        List<String> mentionedUsernames = !mentions.isEmpty() ? this.validUsernamesInUsernames(mentions) : new ArrayList<>();

        List<ReplySnippet> replies = null;
        try {
            replies = record.get("replies", List.class);
        } catch (IllegalArgumentException ex) {
        }

        Boolean isStatusOwnerFollowedByCurrentUser = record.get("is_status_owner_followed_by_current_user", Boolean.class);
        boolean isAllowedToReply = replyAudience == StatusAudience.EVERYONE || (isStatusOwnerFollowedByCurrentUser && replyAudience == StatusAudience.FOLLOWERS);
        boolean isAllowedToShare = shareAudience == StatusAudience.EVERYONE || (isStatusOwnerFollowedByCurrentUser && shareAudience == StatusAudience.FOLLOWERS);

        ParentStatusSnippet nonExistentParent = new ParentStatusSnippet(null, null, null, null, null, null);
        ParentStatusSnippet parentSnippet;
        // Build StatusWithRepliesResponse
        if (parentStatusId == null) {
            parentSnippet = nonExistentParent;
        } else {
            Boolean isParentStatusOwnerFollowedByCurrentUser = record.get("is_parent_status_owner_followed_by_current_user", Boolean.class);
            System.out.println("isParentStatusOwnerFollowedByCurrentUser = " + isParentStatusOwnerFollowedByCurrentUser);
            boolean isAllowedToViewParent = parentStatusPrivacy == StatusPrivacy.PUBLIC || (isParentStatusOwnerFollowedByCurrentUser && parentStatusPrivacy == StatusPrivacy.FOLLOWERS);
            parentSnippet = isAllowedToViewParent ? new ParentStatusSnippet(new UserAvatar(parentOwnerId, parentUsername, parentDisplayName, parentProfilePicture),
                    parentStatusId, parentStatusContent, parentStatusPrivacy, parentPostedAt, parentMedias) : null;
        }

        StatusResponse statusResponse = new StatusResponse(new UserAvatar(statusOwnerId, username, displayName, profilePicture),
                statusId, content, privacy, replyAudience, isAllowedToReply, shareAudience, isAllowedToShare, mentionedUsernames, postedAt,
                numLikes, numReplies, numShares,
                medias, parentSnippet);

        return new StatusWithRepliesResponse(statusResponse, replies);
    }

    private SelectOnConditionStep<Record> fetchStatusResponse() {
        // MULTISET field for media: load actual bytes from storage in converter
        Field<List<MediaResponse>> mediasField = loadStatusMedia(ma, sm, s);
        Field<List<MediaResponse>> parentMediasField = loadStatusMedia(ma2, sm2, sp);

        return dsl.select(s.ID.as("id"), s.CONTENT.as("content"), s.PRIVACY.as("privacy"), s.REPLY_AUDIENCE, s.SHARE_AUDIENCE, s.CREATED_AT.as("posted_at"),
                        s.USER_ID.as("owner_id"), u.USERNAME.as("username"), u.DISPLAY_NAME.as("display_name"), u.PROFILE_PICTURE.as("profile_picture"),
                        DSL.coalesce(DSL.countDistinct(sl.USER_ID), 0).as("num_likes"),
                        DSL.coalesce(DSL.countDistinct(
                                DSL.when(sc.PARENT_ASSOCIATION.eq(ParentAssociation.REPLY), sc.ID)
                        ), 0).as("num_replies"),
                        DSL.coalesce(DSL.countDistinct(
                                DSL.when(sc.PARENT_ASSOCIATION.eq(ParentAssociation.SHARE), sc.ID)
                        ), 0).as("num_shares"), mediasField.as("medias"),
                        u2.ID.as("parent_owner_id"), u2.USERNAME.as("parent_username"), u2.DISPLAY_NAME.as("parent_display_name"), u2.PROFILE_PICTURE.as("parent_profile_picture"),
                        sp.ID.as("parent_id"), sp.CONTENT.as("parent_content"), sp.PRIVACY.as("parent_privacy"), sp.CREATED_AT.as("parent_posted_at"),
                        parentMediasField.as("parent_medias")
                )
                .from(s)
                // join the poster user (to get display name/picture)
                .leftJoin(u).on(u.ID.eq(s.USER_ID))
                .leftJoin(sp).on(s.PARENT_STATUS_ID.eq(sp.ID))
                .leftJoin(u2).on(u2.ID.eq(sp.USER_ID))
                // join followers only to allow 'FOLLOWERS' privacy checks and to restrict feed to followed users
                .leftJoin(uf).on(uf.FOLLOWED_USER_ID.eq(s.USER_ID))
                // standard left joins to aggregate likes/comments/media
                .leftJoin(sl).on(sl.STATUS_ID.eq(s.ID))
                .leftJoin(sc).on(sc.PARENT_STATUS_ID.eq(s.ID));

    }

    private Field<List<MediaResponse>> loadStatusMedia(MediaAsset maTable, StatusMedia smTable, Statuses sTable) {
        // MULTISET field for media: load actual bytes from storage in converter
        return DSL.multiset(
                DSL.select(maTable.MEDIA_ID, maTable.SIZE_BYTES, maTable.FILENAME_HASH, maTable.MIME_TYPE, smTable.POSITION)
                        .from(smTable)
                        .join(maTable).on(maTable.MEDIA_ID.eq(smTable.MEDIA_ID))
                        .where(smTable.STATUS_ID.eq(sTable.ID))
                        .orderBy(smTable.POSITION)
        ).convertFrom(r ->
                r.stream().map(rec -> {
                    try {
                        return new MediaResponse(rec.getValue(maTable.MEDIA_ID), rec.getValue(maTable.FILENAME_HASH),
                                rec.getValue(maTable.MIME_TYPE), rec.getValue(maTable.SIZE_BYTES), rec.getValue(smTable.POSITION));
                    } catch (Exception e) {
                        throw new RuntimeException(e);
                    }
                }).toList()
        );
    }

    private static Instant lastPageInstant(Instant lastSeenCreatedAt, Long lastSeenStatusId) {
        if (lastSeenCreatedAt == null && lastSeenStatusId == null) { // this is the first page
            lastSeenCreatedAt = AppConstants.DEFAULT_MAX_TIMESTAMP;
        }
        return lastSeenCreatedAt;
    }


}
