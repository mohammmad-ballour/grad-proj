package com.grad.social.repository.user;

import com.grad.social.common.AppConstants;
import com.grad.social.common.database.utils.JooqUtils;
import com.grad.social.model.enums.ParentAssociation;
import com.grad.social.model.enums.StatusAudience;
import com.grad.social.model.enums.StatusPrivacy;
import com.grad.social.model.shared.UserAvatar;
import com.grad.social.model.status.response.*;
import com.grad.social.model.tables.*;
import com.grad.social.service.status.utils.StatusUtils;
import lombok.RequiredArgsConstructor;
import org.jooq.*;
import org.jooq.Record;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import static org.jooq.Records.mapping;
import static org.jooq.impl.DSL.row;

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
    UserBlocks ub2 = UserBlocks.USER_BLOCKS.as("ub2");


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

        Field<Boolean> isReplyStatusLikedField =
                DSL.exists(
                        DSL.selectOne()
                                .from(sl2)
                                .where(sl2.STATUS_ID.eq(sc.ID).and(sl2.USER_ID.eq(currentUserId)))
                ).as("is_status_liked_by_current_user");

        // MULTISET of replies with content + counts
        Field<List<ReplySnippet>> repliesField = DSL.multiset(
                        DSL.selectDistinct(
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
                                        DSL.coalesce(DSL.countDistinct(
                                                DSL.when(sc_reply.PARENT_ASSOCIATION.eq(ParentAssociation.SHARE), sc_reply.ID)
                                        ), 0).as("num_shares"),
                                        isReplyStatusLikedField,
                                        // nested medias multiset for this reply
                                        loadStatusMedia(ma_reply, sm_reply, sc).as("medias")
                                )
                                .from(sc)
                                .leftJoin(u_reply).on(u_reply.ID.eq(sc.USER_ID))
                                .leftJoin(sl2).on(sl2.STATUS_ID.eq(sc.ID))   // likes of reply
                                .leftJoin(sc_reply).on(sc_reply.PARENT_STATUS_ID.eq(sc.ID)) // replies of reply
                                .where(sc.PARENT_STATUS_ID.eq(s.ID))
                                .and(sc.PARENT_ASSOCIATION.eq(ParentAssociation.REPLY))
                                .and(
                                        DSL.notExists(
                                                DSL.selectOne()
                                                        .from(ub2)
                                                        .where(ub2.USER_ID.eq(currentUserId).and(ub2.BLOCKED_USER_ID.eq(sc.USER_ID))
                                                                .or(ub2.USER_ID.eq(sc.USER_ID).and(ub2.BLOCKED_USER_ID.eq(currentUserId))))
                                        )
                                )
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
                                rec.get("num_shares", Integer.class),
                                rec.get("is_status_liked_by_current_user", Boolean.class),
                                rec.get("medias", List.class)
                        ))
                )
                .as("replies");

        Field<Boolean> isStatusLikedField =
                DSL.exists(
                        DSL.selectOne()
                                .from(sl)
                                .where(sl.STATUS_ID.eq(s.ID).and(sl.USER_ID.eq(currentUserId)))
                ).as("is_status_liked_by_current_user");

        Record record = dsl.selectDistinct(s.ID.as("id"), s.CONTENT.as("content"), s.PRIVACY.as("privacy"), s.PARENT_ASSOCIATION, s.REPLY_AUDIENCE, s.SHARE_AUDIENCE, s.CREATED_AT.as("posted_at"),
                        s.USER_ID.as("owner_id"), u.USERNAME.as("username"), u.DISPLAY_NAME.as("display_name"), u.PROFILE_PICTURE.as("profile_picture"),
                        DSL.when(uf.FOLLOWER_ID.isNotNull(), true).otherwise(false).as("is_status_owner_followed_by_current_user"),
                        DSL.coalesce(DSL.countDistinct(sl.USER_ID), 0).as("num_likes"),
                        DSL.coalesce(DSL.countDistinct(
                                DSL.when(sc.PARENT_ASSOCIATION.eq(ParentAssociation.REPLY), sc.ID)
                        ), 0).as("num_replies"),
                        DSL.coalesce(DSL.countDistinct(
                                DSL.when(sc.PARENT_ASSOCIATION.eq(ParentAssociation.SHARE), sc.ID)
                        ), 0).as("num_shares"),
                        isStatusLikedField,
                        mediasField.as("medias"),
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

    public List<ReplySnippet> fetchMoreReplies(Long currentUserId, Long statusId, Instant lastSeenCreatedAt, Long lastSeenStatusId) {
        lastSeenCreatedAt = lastPageInstant(lastSeenCreatedAt, lastSeenStatusId);

        // blocks: neither direction (current user blocked poster or poster blocked current user)
        var notBlockedPredicate = DSL.notExists(
                DSL.selectOne()
                        .from(ub)
                        .where(ub.USER_ID.eq(currentUserId).and(ub.BLOCKED_USER_ID.eq(sc.USER_ID))
                                .or(ub.USER_ID.eq(sc.USER_ID).and(ub.BLOCKED_USER_ID.eq(currentUserId))))
        );

        // Privacy predicate: allow if: own post, PUBLIC, FOLLOWERS and (current user follows poster)
        var privacyPredicate = sc.USER_ID.eq(currentUserId)
                .or(sc.PRIVACY.eq(StatusPrivacy.PUBLIC))
                // check that the current user follows the poster
                .or(sc.PRIVACY.eq(StatusPrivacy.FOLLOWERS).and(uf.FOLLOWER_ID.eq(currentUserId)));

        Field<Boolean> isReplyStatusLikedField = DSL.field(
                DSL.exists(
                        DSL.selectOne()
                                .from(sl2)
                                .where(sl2.STATUS_ID.eq(sc.ID).and(sl2.USER_ID.eq(currentUserId)))
                )).as("is_status_liked_by_current_user");

        return dsl.select(sc.ID.as("reply_id"), sc.CONTENT.as("content"), sc.CREATED_AT.as("created_at"),
                        row(u_reply.ID, u_reply.USERNAME, u_reply.DISPLAY_NAME, u_reply.PROFILE_PICTURE).mapping(UserAvatar::new).as("user"),
                        DSL.coalesce(DSL.countDistinct(sl2.USER_ID), 0).as("num_likes"),
                        DSL.coalesce(DSL.countDistinct(
                                DSL.when(sc_reply.PARENT_ASSOCIATION.eq(ParentAssociation.REPLY), sc_reply.ID)
                        ), 0).as("num_replies"),
                        DSL.coalesce(DSL.countDistinct(
                                DSL.when(sc_reply.PARENT_ASSOCIATION.eq(ParentAssociation.SHARE), sc_reply.ID)
                        ), 0).as("num_shares"),
                        isReplyStatusLikedField,
                        // nested medias multiset for this reply
                        loadStatusMedia(ma_reply, sm_reply, sc).as("medias")
                )
                .from(sc)
                .leftJoin(u_reply).on(u_reply.ID.eq(sc.USER_ID))
                .leftJoin(uf).on(uf.FOLLOWED_USER_ID.eq(sc.USER_ID))
                .leftJoin(sl2).on(sl2.STATUS_ID.eq(sc.ID))   // likes of reply
                .leftJoin(sc_reply).on(sc_reply.PARENT_STATUS_ID.eq(sc.ID)) // replies of reply
                .where(sc.PARENT_STATUS_ID.eq(statusId))
                .and(privacyPredicate)
                .and(notBlockedPredicate)
                .and(sc.PARENT_ASSOCIATION.eq(ParentAssociation.REPLY))
                .groupBy(sc.ID, u_reply.ID)
                .orderBy(sc.CREATED_AT.desc(), sc.ID.desc())
                .seek(lastSeenCreatedAt, lastSeenStatusId)
                .limit(AppConstants.DEFAULT_PAGE_SIZE)
                .fetch(mapping(ReplySnippet::new));
    }

    public Integer likeStatus(Long currentUserId, Long statusId) {
        return dsl.insertInto(sl, sl.USER_ID, sl.STATUS_ID)
                .values(currentUserId, statusId)
                .execute();
    }

    public Integer unlikeStatus(Long currentUserId, Long statusId) {
        return JooqUtils.delete(dsl, sl, sl.USER_ID.eq(currentUserId).and(sl.STATUS_ID.eq(statusId)));
    }

    public List<StatusResponse> fetchFeed(Long currentUserId, int offset) {
        // blocks: neither direction (current user blocked poster or poster blocked current user)
        var notBlockedPredicate = DSL.notExists(
                DSL.selectOne()
                        .from(ub)
                        .where(ub.USER_ID.eq(currentUserId).and(ub.BLOCKED_USER_ID.eq(s.USER_ID))
                                .or(ub.USER_ID.eq(s.USER_ID).and(ub.BLOCKED_USER_ID.eq(currentUserId))))
        );

        // mute: current user muted poster and mute still active (muted_until is null => indefinite OR muted_until > now())
        var notMutedPredicate = DSL.notExists(
                DSL.selectOne()
                        .from(um)
                        .where(um.USER_ID.eq(currentUserId)
                                .and(um.MUTED_USER_ID.eq(s.USER_ID))
                                .and(um.MUTED_UNTIL.isNull().or(um.MUTED_UNTIL.greaterThan(Instant.now()))))
        );

        // Privacy predicate: allow if: own post, PUBLIC, FOLLOWERS and (current user follows poster)
        var privacyPredicate =
                s.USER_ID.eq(currentUserId)
                        // check that the current user follows the poster
                        .or(s.PRIVACY.in(StatusPrivacy.PUBLIC, StatusPrivacy.FOLLOWERS).and(uf.FOLLOWER_ID.eq(currentUserId)));

        int pageSize = AppConstants.DEFAULT_PAGE_SIZE;

        // Main query
        Result<Record> result = this.fetchStatusResponse(currentUserId)
                .where((s.PARENT_STATUS_ID.isNull().or(s.PARENT_ASSOCIATION.ne(ParentAssociation.REPLY))))
                .and(privacyPredicate)
                .and(notBlockedPredicate)
                .and(notMutedPredicate)
                .groupBy(s.ID, u.ID, u2.ID, sp.ID, uf.FOLLOWER_ID, uf2.FOLLOWER_ID)
                .orderBy(s.CREATED_AT.desc(), s.ID.desc())
                .offset(offset * pageSize)
                .limit(pageSize)
                .fetch();

        return this.mapToStatusResponseList(result);
    }

    public List<StatusResponse> fetchPosts(Long currentUserId, Long profileOwnerId, int offset) {
        // blocks: neither direction (current user blocked poster or poster blocked current user)
        var notBlockedPredicate = Objects.equals(currentUserId, profileOwnerId) ? DSL.trueCondition() : DSL.notExists(
                DSL.selectOne()
                        .from(ub)
                        .where(ub.USER_ID.eq(currentUserId).and(ub.BLOCKED_USER_ID.eq(s.USER_ID))
                                .or(ub.USER_ID.eq(s.USER_ID).and(ub.BLOCKED_USER_ID.eq(currentUserId))))
        );

        // Privacy predicate: allow if: own post, PUBLIC, FOLLOWERS and (current user follows poster)
        var privacyPredicate = Objects.equals(currentUserId, profileOwnerId) ? DSL.trueCondition() : s.USER_ID.eq(currentUserId)
                .or(s.PRIVACY.eq(StatusPrivacy.PUBLIC))
                // check that the current user follows the poster
                .or(s.PRIVACY.eq(StatusPrivacy.FOLLOWERS).and(uf.FOLLOWER_ID.eq(currentUserId)));

        int pageSize = AppConstants.DEFAULT_PAGE_SIZE;
        // Main query
        Result<Record> result = this.fetchStatusResponse(currentUserId)
                .where((s.USER_ID.eq(profileOwnerId).and(s.PARENT_STATUS_ID.isNull().or(s.PARENT_ASSOCIATION.ne(ParentAssociation.REPLY)))))
                .and(privacyPredicate)
                .and(notBlockedPredicate)
                .groupBy(s.ID, u.ID, u2.ID, sp.ID, uf.FOLLOWER_ID, uf2.FOLLOWER_ID)
                .orderBy(s.IS_PINNED.desc(), s.CREATED_AT.desc(), s.ID.desc())
                .offset(offset * pageSize)
                .limit(pageSize)
                .fetch();

        return this.mapToStatusResponseList(result);
    }

    public List<StatusResponse> fetchReplies(Long currentUserId, Long profileOwnerId, int offset) {
        // blocks: neither direction (current user blocked poster or poster blocked current user)
        var notBlockedPredicate = Objects.equals(currentUserId, profileOwnerId) ? DSL.trueCondition() : DSL.notExists(
                DSL.selectOne()
                        .from(ub)
                        .where(ub.USER_ID.eq(currentUserId).and(ub.BLOCKED_USER_ID.eq(s.USER_ID))
                                .or(ub.USER_ID.eq(s.USER_ID).and(ub.BLOCKED_USER_ID.eq(currentUserId))))
        );

        // Privacy predicate: allow if: own post, PUBLIC, FOLLOWERS and (current user follows poster)
        var privacyPredicate = Objects.equals(currentUserId, profileOwnerId) ? DSL.trueCondition() : s.USER_ID.eq(currentUserId)
                .or(s.PRIVACY.eq(StatusPrivacy.PUBLIC))
                // check that the current user follows the poster
                .or(s.PRIVACY.eq(StatusPrivacy.FOLLOWERS).and(uf.FOLLOWER_ID.eq(currentUserId)));

        int pageSize = AppConstants.DEFAULT_PAGE_SIZE;
        Result<Record> result = this.fetchStatusResponse(currentUserId)
                .where(s.USER_ID.eq(profileOwnerId))
                .and(s.PARENT_ASSOCIATION.eq(ParentAssociation.REPLY))
                .and(privacyPredicate)
                .and(notBlockedPredicate)
                .groupBy(s.ID, u.ID, u2.ID, sp.ID, uf.FOLLOWER_ID, uf2.FOLLOWER_ID)
                .orderBy(s.IS_PINNED.desc(), s.CREATED_AT.desc(), s.ID.desc())
                .offset(offset * pageSize)
                .limit(pageSize)
                .fetch();

        return this.mapToStatusResponseList(result);
    }

    public List<StatusMediaResponse> fetchMedia(Long currentUserId, Long profileOwnerId, int offset) {
        // blocks: neither direction (current user blocked poster or poster blocked current user)
        var notBlockedPredicate = Objects.equals(currentUserId, profileOwnerId) ? DSL.trueCondition() : DSL.notExists(
                DSL.selectOne()
                        .from(ub)
                        .where(ub.USER_ID.eq(currentUserId).and(ub.BLOCKED_USER_ID.eq(s.USER_ID))
                                .or(ub.USER_ID.eq(s.USER_ID).and(ub.BLOCKED_USER_ID.eq(currentUserId))))
        );

        // Privacy predicate: allow if: own post, PUBLIC, FOLLOWERS and (current user follows poster)
        var privacyPredicate = Objects.equals(currentUserId, profileOwnerId) ? DSL.trueCondition() : s.USER_ID.eq(currentUserId)
                .or(s.PRIVACY.eq(StatusPrivacy.PUBLIC))
                // check that the current user follows the poster
                .or(s.PRIVACY.eq(StatusPrivacy.FOLLOWERS).and(uf.FOLLOWER_ID.eq(currentUserId)));

        int pageSize = AppConstants.DEFAULT_PAGE_SIZE;
        return dsl.selectDistinct(s.ID, s.CREATED_AT, sm.MEDIA_ID, ma.MIME_TYPE, ma.SIZE_BYTES, sm.POSITION)
                .from(s)
                .join(sm).on(sm.STATUS_ID.eq(s.ID))
                .join(ma).on(ma.MEDIA_ID.eq(sm.MEDIA_ID))
                .join(uf).on(uf.FOLLOWED_USER_ID.eq(s.USER_ID))
                .where(s.USER_ID.eq(profileOwnerId))
                .and(privacyPredicate)
                .and(notBlockedPredicate)
                .orderBy(s.CREATED_AT.desc(), s.ID.desc())
                .offset(offset * pageSize)
                .limit(pageSize)
                .fetch(mapping(StatusMediaResponse::new));
    }

    public List<StatusResponse> fetchStatusesLiked(Long currentUserId, int offset) {
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

        int pageSize = AppConstants.DEFAULT_PAGE_SIZE;
        Result<Record> result = this.fetchStatusResponse(currentUserId)
                .where(sl.USER_ID.eq(currentUserId))
                .and(privacyPredicate)
                .and(notBlockedPredicate)
                .groupBy(s.ID, u.ID, u2.ID, sp.ID, uf.FOLLOWER_ID, uf2.FOLLOWER_ID, sl.CREATED_AT)
                .orderBy(sl.CREATED_AT.desc(), s.ID.desc())
                .offset(offset * pageSize)
                .limit(pageSize)
                .fetch();

        return this.mapToStatusResponseList(result);
    }


    // Helpers
    public boolean canViewStatus(Long currentUserId, Long statusId) {
        return dsl.fetchExists(dsl.selectOne()
                .from(s).join(uf).on(s.USER_ID.eq(uf.FOLLOWED_USER_ID))
                .where(s.ID.eq(statusId)
                        .and((s.USER_ID.eq(currentUserId))
                                .or(s.PRIVACY.eq(StatusPrivacy.PUBLIC)
                                        .or(s.PRIVACY.eq(StatusPrivacy.FOLLOWERS).and(uf.FOLLOWER_ID.eq(currentUserId)))
                                ))));
    }

    public List<String> validUsernamesInUsernames(List<String> mentionedUsernames) {
        return dsl.select(u.USERNAME)
                .from(u)
                .where(u.USERNAME.in(mentionedUsernames))
                .fetchInto(String.class);
    }

    private List<StatusResponse> mapToStatusResponseList(Result<Record> records) {
        return records.stream()
                .map(this::mapToStatusResponse)
                .toList();
    }

    private StatusResponse mapToStatusResponse(Record record) {
        // Extract all fields manually
        Long statusId = record.get("id", Long.class);
        String content = record.get("content", String.class);
        boolean isPinned = record.get("is_pinned", Boolean.class);
        StatusPrivacy privacy = record.get("privacy", StatusPrivacy.class);
        ParentAssociation parentAssociation = record.get("parent_association", ParentAssociation.class);
        StatusAudience replyAudience = record.get("reply_audience", StatusAudience.class);
        StatusAudience shareAudience = record.get("share_audience", StatusAudience.class);
        Instant postedAt = record.get("posted_at", Instant.class);

        Long statusOwnerId = record.get("owner_id", Long.class);
        String username = record.get("username", String.class);
        String displayName = record.get("display_name", String.class);
        byte[] profilePicture = record.get("profile_picture", byte[].class);

        boolean isStatusLikedByCurrentUser = record.get("is_status_liked_by_current_user", boolean.class);
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
            boolean isAllowedToViewParent = parentStatusPrivacy == StatusPrivacy.PUBLIC || (isParentStatusOwnerFollowedByCurrentUser && parentStatusPrivacy == StatusPrivacy.FOLLOWERS);
            parentSnippet = isAllowedToViewParent ? new ParentStatusSnippet(new UserAvatar(parentOwnerId, parentUsername, parentDisplayName, parentProfilePicture),
                    parentStatusId, parentStatusContent, parentStatusPrivacy, parentPostedAt, parentMedias) : null;
        }

        // Build StatusResponse
        return new StatusResponse(new UserAvatar(statusOwnerId, username, displayName, profilePicture),
                statusId, content, isPinned, privacy, replyAudience, isAllowedToReply, shareAudience, isAllowedToShare, mentionedUsernames, postedAt,
                isStatusLikedByCurrentUser, numLikes, numReplies, numShares,
                medias, parentAssociation, parentSnippet
        );
    }

    private StatusWithRepliesResponse mapToStatusWithRepliesResponse(Record record) {
        if (record == null) {
            return null;
        }

        // Extract all fields manually
        Long statusId = record.get("id", Long.class);
        String content = record.get("content", String.class);
        StatusPrivacy privacy = record.get("privacy", StatusPrivacy.class);
        ParentAssociation parentAssociation = record.get("parent_association", ParentAssociation.class);
        StatusAudience replyAudience = record.get("reply_audience", StatusAudience.class);
        StatusAudience shareAudience = record.get("share_audience", StatusAudience.class);
        Instant postedAt = record.get("posted_at", Instant.class);

        Long statusOwnerId = record.get("owner_id", Long.class);
        String username = record.get("username", String.class);
        String displayName = record.get("display_name", String.class);
        byte[] profilePicture = record.get("profile_picture", byte[].class);

        boolean isStatusLikedByCurrentUser = record.get("is_status_liked_by_current_user", boolean.class);
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
            boolean isAllowedToViewParent = parentStatusPrivacy == StatusPrivacy.PUBLIC || (isParentStatusOwnerFollowedByCurrentUser && parentStatusPrivacy == StatusPrivacy.FOLLOWERS);
            parentSnippet = isAllowedToViewParent ? new ParentStatusSnippet(new UserAvatar(parentOwnerId, parentUsername, parentDisplayName, parentProfilePicture),
                    parentStatusId, parentStatusContent, parentStatusPrivacy, parentPostedAt, parentMedias) : null;
        }

        StatusResponse statusResponse = new StatusResponse(new UserAvatar(statusOwnerId, username, displayName, profilePicture),
                statusId, content, false, privacy, replyAudience, isAllowedToReply, shareAudience, isAllowedToShare, mentionedUsernames, postedAt,
                isStatusLikedByCurrentUser, numLikes, numReplies, numShares,
                medias, parentAssociation, parentSnippet);

        return new StatusWithRepliesResponse(statusResponse, replies);
    }

    private SelectOnConditionStep<Record> fetchStatusResponse(Long currentUserId) {
        // MULTISET field for media: load actual bytes from storage in converter
        Field<List<MediaResponse>> mediasField = loadStatusMedia(ma, sm, s);
        Field<List<MediaResponse>> parentMediasField = loadStatusMedia(ma2, sm2, sp);

        Field<Boolean> isStatusLikedField =
                DSL.exists(
                        DSL.selectOne()
                                .from(sl)
                                .where(sl.STATUS_ID.eq(s.ID).and(sl.USER_ID.eq(currentUserId)))
                ).as("is_status_liked_by_current_user");

        return dsl.select(s.ID.as("id"), s.CONTENT.as("content"), s.IS_PINNED, s.PRIVACY.as("privacy"), s.PARENT_ASSOCIATION, s.REPLY_AUDIENCE, s.SHARE_AUDIENCE, s.CREATED_AT.as("posted_at"),
                        s.USER_ID.as("owner_id"), u.USERNAME.as("username"), u.DISPLAY_NAME.as("display_name"), u.PROFILE_PICTURE.as("profile_picture"),
                        DSL.when(uf.FOLLOWER_ID.isNotNull(), true).otherwise(false).as("is_status_owner_followed_by_current_user"),
                        DSL.coalesce(DSL.countDistinct(sl.USER_ID), 0).as("num_likes"),
                        DSL.coalesce(DSL.countDistinct(
                                DSL.when(sc.PARENT_ASSOCIATION.eq(ParentAssociation.REPLY), sc.ID)
                        ), 0).as("num_replies"),
                        DSL.coalesce(DSL.countDistinct(
                                DSL.when(sc.PARENT_ASSOCIATION.eq(ParentAssociation.SHARE), sc.ID)
                        ), 0).as("num_shares"),
                        isStatusLikedField, mediasField.as("medias"),
                        DSL.when(uf2.FOLLOWER_ID.isNotNull(), true).otherwise(false).as("is_parent_status_owner_followed_by_current_user"),
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
                .leftJoin(uf).on(uf.FOLLOWED_USER_ID.eq(s.USER_ID).and(uf.FOLLOWER_ID.eq(currentUserId)))
                .leftJoin(uf2).on(uf2.FOLLOWED_USER_ID.eq(sp.USER_ID).and(uf2.FOLLOWER_ID.eq(currentUserId)))
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
                        return new MediaResponse(rec.getValue(maTable.MEDIA_ID), rec.getValue(maTable.MIME_TYPE), rec.getValue(maTable.SIZE_BYTES), rec.getValue(smTable.POSITION));
                    } catch (Exception e) {
                        throw new RuntimeException(e);
                    }
                }).toList()
        );
    }

    private static Instant lastPageInstant(Instant lastSeenCreatedAt, Long lastSeenEntityId) {
        if (lastSeenCreatedAt == null && lastSeenEntityId == null) { // this is the first page
            lastSeenCreatedAt = AppConstants.DEFAULT_MAX_TIMESTAMP;
        }
        return lastSeenCreatedAt;
    }


}
