package com.grad.social.repository.media;

import com.grad.social.common.model.MediaRepresentation;
import com.grad.social.model.tables.MediaAsset;
import com.grad.social.model.tables.StatusMedia;
import com.grad.social.model.tables.Statuses;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;

import static org.jooq.Records.mapping;

@Repository
@RequiredArgsConstructor
public class MediaRepository {
    private final DSLContext dsl;

    Statuses s = Statuses.STATUSES;
    MediaAsset ma = MediaAsset.MEDIA_ASSET;
    StatusMedia sm = StatusMedia.STATUS_MEDIA;

    public Map<String, Long> findMediaAssetIdsByHashes(Set<String> hashes) {
        return dsl.select(ma.CONTENT_HASH, ma.MEDIA_ID)
                .from(ma)
                .where(ma.CONTENT_HASH.in(hashes))
                .fetchMap(ma.CONTENT_HASH, ma.MEDIA_ID);
    }

    public Long insertMediaAsset(MediaRepresentation newAsset) {
        return dsl.insertInto(ma)
                .set(ma.CONTENT_HASH, newAsset.getContentHashed())
                .set(ma.FILENAME_HASH, newAsset.getFileNameHashed())
                .set(ma.SIZE_BYTES, newAsset.getSizeInBytes())
                .set(ma.MIME_TYPE, newAsset.getMimeType())
                .returning(ma.MEDIA_ID)
                .fetchOne()
                .getMediaId();
    }

    public void insertMediaAssetsBatch(List<MediaRepresentation> newAssets) {
        var records = newAssets.stream()
                .map(media -> {
                    var asset = dsl.newRecord(ma);
                    asset.setContentHash(media.getContentHashed());
                    asset.setFilenameHash(media.getFileNameHashed());
                    asset.setSizeBytes(media.getSizeInBytes());
                    asset.setMimeType(media.getMimeType());
                    return asset;
                }).toList();

        dsl.batchInsert(records).execute();
    }

    public void deleteMediaAsset(List<Long> mediaId) {
        dsl.deleteFrom(ma).where(ma.MEDIA_ID.in(mediaId)).execute();
    }



    public MediaRepresentation getMediaById(Long mediaId) {
        return dsl.select(ma.FILENAME_HASH, ma.CONTENT_HASH, ma.MIME_TYPE, ma.SIZE_BYTES)
                .from(ma)
                .where(ma.MEDIA_ID.eq(mediaId))
                .fetchOne(mapping((fileNameHashed, contentHashed, mediaType, sizeInBytes) -> {
                    var res = new MediaRepresentation(fileNameHashed, contentHashed, mediaType, sizeInBytes);
                    res.setMediaId(mediaId);
                    return res;
                }));
    }

    public Map<String, Long> findMediaIdsByHashes(Set<String> hashes) {
        return dsl.select(ma.CONTENT_HASH, ma.MEDIA_ID)
                .from(ma)
                .where(ma.CONTENT_HASH.in(hashes))
                .fetchMap(ma.CONTENT_HASH, ma.MEDIA_ID);
    }

    public void deleteMediaAssets(List<Long> mediaId) {
        dsl.deleteFrom(ma).where(ma.MEDIA_ID.in(mediaId)).execute();
    }


    // status media
    public List<MediaRepresentation> getStatusMediasByStatusId(Long statusId) {
        return dsl.select(ma.MEDIA_ID, ma.FILENAME_HASH, ma.CONTENT_HASH, ma.MIME_TYPE, ma.SIZE_BYTES, DSL.count().as("ref_count"))
                .from(sm)
                .join(ma).on(sm.MEDIA_ID.eq(ma.MEDIA_ID))
                .where(sm.STATUS_ID.eq(statusId))
                .groupBy(ma.MEDIA_ID, ma.FILENAME_HASH, ma.CONTENT_HASH, ma.MIME_TYPE, ma.SIZE_BYTES)
                .fetch(mapping((mediaId, fileNameHashed, contentHashed, mediaType, sizeInBytes, refCount) -> {
                    var mediaRepresentation = new MediaRepresentation(fileNameHashed, contentHashed, mediaType, sizeInBytes);
                    mediaRepresentation.setMediaId(mediaId);
                    mediaRepresentation.setRefCount(refCount);
                    return mediaRepresentation;
                }));
    }

    public List<MediaRepresentation> getStatusMediasByStatusIdAndMediaIds(Long statusId, List<Long> mediaIds) {
        return dsl.select(ma.MEDIA_ID, ma.FILENAME_HASH, ma.CONTENT_HASH, ma.MIME_TYPE, ma.SIZE_BYTES, DSL.count().as("ref_count"))
                .from(sm)
                .join(ma).on(sm.MEDIA_ID.eq(ma.MEDIA_ID))
                .where(sm.STATUS_ID.eq(statusId).and(sm.MEDIA_ID.in(mediaIds)))
                .groupBy(ma.MEDIA_ID, ma.FILENAME_HASH, ma.CONTENT_HASH, ma.MIME_TYPE, ma.SIZE_BYTES)
                .fetch(mapping((mediaId, fileNameHashed, contentHashed, mediaType, sizeInBytes, refCount) -> {
                    var mediaRepresentation = new MediaRepresentation(fileNameHashed, contentHashed, mediaType, sizeInBytes);
                    mediaRepresentation.setMediaId(mediaId);
                    mediaRepresentation.setRefCount(refCount);
                    return mediaRepresentation;
                }));
    }

    public void addMediaToStatusBatch(Long statusId, List<Long> newMediaIds, int startPosition) {
        var position = new AtomicInteger(startPosition);
        var records = newMediaIds.stream()
                .map(mediaId -> {
                    var statusMedia = dsl.newRecord(sm);
                    statusMedia.setStatusId(statusId);
                    statusMedia.setMediaId(mediaId);
                    statusMedia.setPosition(position.getAndIncrement());
                    return statusMedia;
                }).toList();

        dsl.batchInsert(records).execute();
    }
}
