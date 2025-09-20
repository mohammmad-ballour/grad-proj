package com.grad.social.service.media;

import com.grad.social.common.model.MediaRepresentation;
import com.grad.social.common.utils.media.FileSystemUtils;
import com.grad.social.repository.media.MediaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class MediaService {
    private final MediaRepository mediaRepository;

    public MediaRepresentation getMediaById(Long mediaId) {
        return this.mediaRepository.getMediaById(mediaId);
    }

    public Map<String, Long> findMediaIdsByHashes(Set<String> hashes) {
        return this.mediaRepository.findMediaIdsByHashes(hashes);
    }

    public void deleteMediaAssets(List<Long> mediaId) {
        this.mediaRepository.deleteMediaAssets(mediaId);
    }

    public void insertMediaAssetsBatch(List<MediaRepresentation> newAssets) {
        this.mediaRepository.insertMediaAssetsBatch(newAssets);
    }

    public List<MediaRepresentation> getStatusMediasByStatusId(Long statusId) {
        return this.mediaRepository.getStatusMediasByStatusId(statusId);
    }

    public List<MediaRepresentation> getStatusMediasByStatusIdAndMediaIds(Long statusId, List<Long> mediaIds) {
        return this.mediaRepository.getStatusMediasByStatusIdAndMediaIds(statusId, mediaIds);
    }

    public void addMediaToStatusBatch(Long statusId, List<Long> newMediaIds, int startPosition) {
        this.mediaRepository.addMediaToStatusBatch(statusId, newMediaIds, startPosition);
    }

    public FileSystemResource loadMedia(String fileNameHashed) throws Exception {
        return FileSystemUtils.loadFile(fileNameHashed);
    }
}