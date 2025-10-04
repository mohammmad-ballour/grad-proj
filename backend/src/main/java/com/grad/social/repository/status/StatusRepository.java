package com.grad.social.repository.status;

import com.grad.social.common.database.utils.JooqUtils;
import com.grad.social.common.database.utils.TsidUtils;
import com.grad.social.model.enums.AccountStatus;
import com.grad.social.model.enums.ParentAssociation;
import com.grad.social.model.status.StatusConstants;
import com.grad.social.model.status.request.CreateStatusRequest;
import com.grad.social.model.status.response.StatusAssociation;
import com.grad.social.model.status.response.StatusPrivacyInfo;
import com.grad.social.model.tables.MediaAsset;
import com.grad.social.model.tables.StatusMedia;
import com.grad.social.model.tables.Statuses;
import com.grad.social.model.tables.ContentModeration;
import com.grad.social.model.tables.Users;
import com.grad.social.repository.media.MediaRepository;
import com.grad.social.model.status.ModerationResult;
import io.hypersistence.tsid.TSID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Objects;

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


    // Helpers
    public boolean statusExistsById(Long statusId) {
        return JooqUtils.existsBy(dsl, s, s.ID.eq(statusId));
    }

    public StatusPrivacyInfo getStatusPrivacyInfo(Long statusId) {
        return dsl.select(s.USER_ID, s.PRIVACY, s.REPLY_AUDIENCE, s.SHARE_AUDIENCE)
                .from(s)
                .where(s.ID.eq(statusId))
                .fetchOneInto(StatusPrivacyInfo.class);
    }

    public StatusAssociation getParentStatusByChildStatusId(Long statusId) {
        return dsl.select(s.PARENT_STATUS_ID, s.PARENT_ASSOCIATION)
                .from(s)
                .where(s.ID.eq(statusId))
                .fetchOneInto(StatusAssociation.class);
    }

    public void updateTsVector(Long statusId, String lang, String content) {
        dsl.update(s)
                .set(s.CONTENT_TSVECTOR,
                        DSL.field("to_tsvector({0}::regconfig, {1})", String.class, DSL.inline(lang), DSL.val(content)))
                .where(s.ID.eq(statusId))
                .execute();

    }

    public List<Long> validUsersInUsernames(List<String> mentionedUsernames) {
        return dsl.select(u.ID)
                .from(u)
                .where(u.USERNAME.in(mentionedUsernames))
                .fetchInto(Long.class);
    }
}
