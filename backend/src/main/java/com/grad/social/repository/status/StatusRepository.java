package com.grad.social.repository.status;

import com.grad.social.common.database.utils.JooqUtils;
import com.grad.social.common.database.utils.TsidUtils;
import com.grad.social.model.enums.AccountStatus;
import com.grad.social.model.enums.ParentAssociation;
import com.grad.social.model.status.StatusConstants;
import com.grad.social.model.status.helper.StatusMetadata;
import com.grad.social.model.status.request.CreateStatusRequest;
import com.grad.social.model.status.request.UpdateStatusContent;
import com.grad.social.model.status.request.UpdateStatusSettings;
import com.grad.social.model.status.response.StatusPrivacyInfo;
import com.grad.social.model.tables.MediaAsset;
import com.grad.social.model.tables.StatusMedia;
import com.grad.social.model.tables.Statuses;
import com.grad.social.model.tables.ContentModeration;
import com.grad.social.model.tables.Users;
import com.grad.social.model.tables.records.StatusesRecord;
import com.grad.social.repository.media.MediaRepository;
import com.grad.social.model.status.ModerationResult;
import io.hypersistence.tsid.TSID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.jooq.TableField;
import org.jooq.impl.DSL;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

import static org.jooq.Records.mapping;
import static org.jooq.impl.DSL.field;
import static org.jooq.impl.DSL.inline;

@Repository
@RequiredArgsConstructor
public class StatusRepository {
    private final DSLContext dsl;
    private final TSID.Factory tsidFactory = TsidUtils.getTsidFactory(2);
    private final MediaRepository mediaRepository;

    Statuses s = Statuses.STATUSES;
    MediaAsset ma = MediaAsset.MEDIA_ASSET;
    StatusMedia sm = StatusMedia.STATUS_MEDIA;
    ContentModeration cm = ContentModeration.CONTENT_MODERATION;
    Users u = Users.USERS;

    @Retryable(retryFor = {DuplicateKeyException.class}, maxAttempts = 5, backoff = @Backoff(delay = 1000))
    public Long createStatus(Long userId, Long parentStatusId, ParentAssociation parentAssociation, CreateStatusRequest toCreate) {
        return Objects.requireNonNull(dsl
                        .insertInto(s, s.ID, s.CONTENT, s.PRIVACY, s.REPLY_AUDIENCE, s.SHARE_AUDIENCE, s.PARENT_STATUS_ID, s.PARENT_ASSOCIATION, s.USER_ID)
                        .values(tsidFactory.generate().toLong(), toCreate.content(), toCreate.privacy(), toCreate.replyAudience(),
                                toCreate.shareAudience(), parentStatusId, parentAssociation, userId)
                        .returning(s.ID)
                        .fetchOne())
                .getId();
    }

    public void saveContentModeration(Long statusId, ModerationResult moderationResult) {
        dsl.insertInto(cm, cm.STATUS_ID, cm.SEVERITY, cm.CATEGORY, cm.DESCRIPTION)
                .values(statusId, moderationResult.severity(), moderationResult.category(), moderationResult.description())
                .onDuplicateKeyUpdate()
                .set(cm.SEVERITY, moderationResult.severity())
                .set(cm.CATEGORY, moderationResult.category())
                .set(cm.DESCRIPTION, moderationResult.description())
                .execute();
    }

    public boolean checkWhetherToRestrictUser(Long userId) {
        var startDateTime = Instant.now().minus(StatusConstants.DAYS_TO_CHECK, ChronoUnit.DAYS);
        var statusCount = dsl.selectCount()
                .from(cm)
                .join(s)
                .on(s.ID.eq(cm.STATUS_ID))
                .where(s.USER_ID.eq(userId))
                .and(cm.SEVERITY.in(3, 4))
                .and(s.CREATED_AT.ge(startDateTime))
                .fetchOne(0, int.class);

        // If the count meets or exceeds X, restrict the user's account
        if (statusCount != null && statusCount >= StatusConstants.UNSAFE_STATUES_THRESHOLD) {
            JooqUtils.update(dsl, u, Map.of(u.ACCOUNT_STATUS, AccountStatus.RESTRICTED), u.ID.eq(userId));
            return true;
        }
        return false;
    }

    public int deleteStatus(Long statusId) {
        return JooqUtils.delete(dsl, s, s.ID.eq(statusId));
    }

    public void updateStatusSettings(List<Long> statusIds, UpdateStatusSettings toUpdate) {
        Map<TableField<StatusesRecord, ?>, Object> fieldsToUpdate = new HashMap<>();

        if (toUpdate.statusPrivacy() != null) {
            fieldsToUpdate.put(s.PRIVACY, toUpdate.statusPrivacy());
        }
        if (toUpdate.replyAudience() != null) {
            fieldsToUpdate.put(s.REPLY_AUDIENCE, toUpdate.replyAudience());
        }
        if (toUpdate.shareAudience() != null) {
            fieldsToUpdate.put(s.SHARE_AUDIENCE, toUpdate.shareAudience());
        }
        if (!fieldsToUpdate.isEmpty()) {
            JooqUtils.update(dsl, s, fieldsToUpdate, s.ID.in(statusIds));
        }
    }

    public int updateStatusContent(Long statusId, UpdateStatusContent toUpdate) {
        // 1. Update text
        Map<TableField<StatusesRecord, ?>, Object> fieldsToUpdate = new HashMap<>();
        if (toUpdate.newContent() != null) {
            fieldsToUpdate.put(s.CONTENT, toUpdate.newContent());
        }
        int recordsUpdated = 0;
        if (!fieldsToUpdate.isEmpty()) {
            recordsUpdated = JooqUtils.update(dsl, s, fieldsToUpdate, s.ID.eq(statusId));
        }

        // 2. Keep only provided media
        JooqUtils.delete(dsl, sm, sm.STATUS_ID.eq(statusId).and(sm.MEDIA_ID.notIn(toUpdate.keepMediaIds() == null ? List.of() : toUpdate.keepMediaIds())));

        // 3. Ensure positions are compacted; ordering is taken from the existing position column
        var reordered = dsl.select(sm.MEDIA_ID, DSL.rowNumber().over().orderBy(sm.POSITION).as("new_pos"))
                .from(sm)
                .where(sm.STATUS_ID.eq(statusId))
                .and(sm.MEDIA_ID.in(toUpdate.keepMediaIds()))
                .asTable("reordered");

        dsl.update(sm)
                .set(sm.POSITION, reordered.field("new_pos", Integer.class))
                .from(reordered)
                .where(sm.STATUS_ID.eq(statusId))
                .and(sm.MEDIA_ID.eq(reordered.field(sm.MEDIA_ID)))
                .execute();

        return recordsUpdated;
    }

    public List<String> fullTextSearch(String keywords, String lang) {
        return dsl.select(s.CONTENT)
                .from(s)
                .where(field("content_tsvector @@ to_tsquery({0}, {1})",
                        Boolean.class,
                        inline(lang), inline(keywords))
                )
                .fetchInto(String.class);
    }


    // Helpers
    public boolean statusExistsById(Long statusId) {
        return JooqUtils.existsBy(dsl, s, s.ID.eq(statusId));
    }

    public String getContentById(Long statusId) {
        return dsl.select(s.CONTENT)
                .from(s)
                .where(s.ID.eq(statusId))
                .fetchOneInto(String.class);
    }

    public StatusPrivacyInfo getStatusPrivacyInfo(Long statusId) {
        return dsl.select(s.USER_ID, s.PRIVACY, s.REPLY_AUDIENCE, s.SHARE_AUDIENCE)
                .from(s)
                .where(s.ID.eq(statusId))
                .fetchOneInto(StatusPrivacyInfo.class);
    }

    public StatusMetadata getStatusMetadata(Long statusId) {
        return dsl.select(s.PRIVACY, s.REPLY_AUDIENCE, s.SHARE_AUDIENCE)
                .from(s)
                .where(s.ID.eq(statusId))
                .fetchOne(mapping(StatusMetadata::new));
    }

    public ParentAssociation getStatusParentAssociation(Long statusId) {
        return dsl.select(s.PARENT_ASSOCIATION)
                .from(s)
                .where(s.ID.eq(statusId))
                .fetchOneInto(ParentAssociation.class);
    }

    public void updateTsVector(Long statusId, String lang, String content) {
        try {
            dsl.update(s)
                    .set(s.CONTENT_TSVECTOR,
                            field("to_tsvector({0}::regconfig, {1})", String.class, inline(lang), DSL.val(content)))
                    .where(s.ID.eq(statusId))
                    .execute();
        } catch (org.jooq.exception.DataAccessException e) {
            String msg = e.getMessage();
            if (msg != null && msg.contains("text search configuration") && msg.contains("does not exist")) {
                return;
            }
        }

    }

    public List<Long> validUsersInUsernames(List<String> mentionedUsernames) {
        return dsl.select(u.ID)
                .from(u)
                .where(u.USERNAME.in(mentionedUsernames))
                .fetchInto(Long.class);
    }

    public List<Long> getRepliesIds(Long parentStatusId) {
        return dsl.select(s.ID)
                .from(s)
                .where(s.PARENT_STATUS_ID.eq(parentStatusId).and(s.PARENT_ASSOCIATION.eq(ParentAssociation.REPLY)))
                .fetchInto(Long.class);
    }
}
