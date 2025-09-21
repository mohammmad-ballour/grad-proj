package com.grad.social.repository.status;

import com.grad.social.model.status.response.StatusAssociation;
import com.grad.social.model.status.response.StatusPrivacyInfo;
import com.grad.social.model.tables.MediaAsset;
import com.grad.social.model.tables.StatusMedia;
import com.grad.social.model.tables.Statuses;
import com.grad.social.model.tables.Users;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class StatusRepository {
    private final DSLContext dsl;

    Statuses s = Statuses.STATUSES;
    MediaAsset ma = MediaAsset.MEDIA_ASSET;
    StatusMedia sm = StatusMedia.STATUS_MEDIA;
    Users u = Users.USERS;


    // Helpers
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
}
