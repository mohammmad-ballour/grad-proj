package com.grad.social.repository.media;

import com.grad.social.common.model.MediaRepresentation;
import com.grad.social.model.tables.MediaAsset;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Repository
@RequiredArgsConstructor
public class MediaRepository {
    private final DSLContext dsl;

    MediaAsset ma = MediaAsset.MEDIA_ASSET.as("ma");

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
}
