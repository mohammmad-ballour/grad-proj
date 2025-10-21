package com.grad.social.repository.status;

import com.grad.social.model.tables.Bookmarks;
import com.grad.social.model.tables.MediaAsset;
import com.grad.social.model.tables.StatusMedia;
import com.grad.social.model.tables.Statuses;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

import java.time.Instant;


@Repository
@RequiredArgsConstructor
public class BookmarkRepository {

    private final DSLContext dsl;

    Statuses s = Statuses.STATUSES;
    MediaAsset ma = MediaAsset.MEDIA_ASSET;
    StatusMedia sm = StatusMedia.STATUS_MEDIA;
    Bookmarks b = Bookmarks.BOOKMARKS;

    public void insertBookmark(Long userId, Long statusId) {
        dsl.insertInto(b)
           .set(b.USER_ID, userId)
           .set(b.STATUS_ID, statusId)
           .set(b.SAVED_AT, Instant.now())
           .onConflictDoNothing()
           .execute();
    }

    public void deleteBookmark(Long userId, Long statusId) {
        dsl.deleteFrom(b)
           .where(b.USER_ID.eq(userId))
           .and(b.STATUS_ID.eq(statusId))
           .execute();
    }
}
