package com.grad.social.service.status;

import com.grad.social.common.AppConstants;
import com.grad.social.common.exceptionhandling.AlreadyRegisteredException;
import com.grad.social.common.exceptionhandling.Model;
import com.grad.social.common.exceptionhandling.ModelNotFoundException;
import com.grad.social.common.model.MediaRepresentation;
import com.grad.social.common.utils.media.FileSystemUtils;
import com.grad.social.common.utils.media.MediaUtils;
import com.grad.social.exception.status.StatusErrorCode;
import com.grad.social.model.enums.NotificationType;
import com.grad.social.model.enums.ParentAssociation;
import com.grad.social.model.status.request.CreateStatusRequest;
import com.grad.social.model.status.request.UpdateStatusContent;
import com.grad.social.model.status.request.UpdateStatusSettings;
import com.grad.social.repository.status.StatusRepository;
import com.grad.social.service.media.MediaService;
import com.grad.social.service.notification.NotificationService;
import com.grad.social.service.status.event.StatusContentUpdatedEvent;
import com.grad.social.service.status.event.StatusPublishedEvent;
import com.grad.social.service.status.utils.StatusUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StatusService {
    private final StatusRepository statusRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final MediaService mediaService;
    private final NotificationService notificationService;

    // currentUserId == statusOwnerId
    @Transactional
    public Long createStatus(Long currentUserId, CreateStatusRequest toCreate, List<MultipartFile> mediaFiles) throws Exception {
        var parentStatus = toCreate.parentStatus();
        Long parentStatusId = null;
        ParentAssociation parentAssociation = null;

        // a child status
        if (parentStatus != null && parentStatus.statusId() != null) {
            parentStatusId = Long.parseLong(parentStatus.statusId());
            parentAssociation = parentStatus.parentAssociation();
        }
        try {
            if (parentStatusId != null && !this.statusRepository.statusExistsById(parentStatusId)) {
                throw new ModelNotFoundException(Model.STATUS, parentStatusId);
            }
            this.checkWhetherToRestrictUser(currentUserId);
            long savedStatusId = this.statusRepository.createStatus(currentUserId, parentStatusId, parentAssociation, toCreate);
            if (mediaFiles != null && !mediaFiles.isEmpty()) {
                this.uploadStatusMediaBatch(savedStatusId, mediaFiles, 1);
            }
            if (parentAssociation != null) {
                Long parentStatusOwnerId = toCreate.parentStatus().statusOwnerId();
                if (parentAssociation == ParentAssociation.REPLY) {
                    this.notificationService.saveNotification(currentUserId, new Long[]{parentStatusOwnerId}, savedStatusId, NotificationType.REPLY);
                } else if (parentAssociation == ParentAssociation.SHARE) {
                    this.notificationService.saveNotification(currentUserId, new Long[]{parentStatusOwnerId}, savedStatusId, NotificationType.SHARE);
                }
            }
            List<String> mentions = StatusUtils.extractMentions(toCreate.content());
            if (!mentions.isEmpty()) {
                List<Long> mentionedUsersIds = this.statusRepository.validUsersInUsernames(mentions);
                this.notificationService.saveNotification(currentUserId, mentionedUsersIds.toArray(Long[]::new), savedStatusId, NotificationType.MENTION);
            }
            this.eventPublisher.publishEvent(new StatusPublishedEvent(savedStatusId, toCreate.content()));
            return savedStatusId;
        } catch (DuplicateKeyException e) {
            throw new AlreadyRegisteredException(StatusErrorCode.STATUS_ALREADY_EXISTS);
        }
    }

    private void checkWhetherToRestrictUser(Long currentUserId) {
        boolean shouldRestrict = this.statusRepository.checkWhetherToRestrictUser(currentUserId);
        if (shouldRestrict) {
            System.out.printf("Sending a notification to user %d to restrict their account%n", currentUserId);
            this.notificationService.saveNotification(AppConstants.SYSTEM_USER, new Long[]{currentUserId}, null, NotificationType.RESTRICT);
        }
    }

    @Transactional
    public void deleteStatus(Long statusId) throws Exception {
        // Corresponding notifications for that statusId are deleted automatically at db level
        this.deleteStatusMedia(statusId);
        int recordsDeleted = this.statusRepository.deleteStatus(statusId);
        if (recordsDeleted == 0) throw new ModelNotFoundException(Model.STATUS, statusId);
    }

    @Transactional
    public void updateStatusContent(Long statusId, UpdateStatusContent toUpdate, List<MultipartFile> mediaFiles) throws Exception {
        // 1. remove deleted media if not referenced by any other status
        this.deleteStatusMedia(statusId, toUpdate.removeMediaIds());

        // 2. Update text, keep only provided media
        String oldContent = statusRepository.getContentById(statusId);
        int recordsUpdated = this.statusRepository.updateStatusContent(statusId, toUpdate);

        if (recordsUpdated != 0) {
            this.eventPublisher.publishEvent(new StatusContentUpdatedEvent(statusId, oldContent, toUpdate.newContent()));
        } else {
            throw new ModelNotFoundException(Model.STATUS, statusId);
        }

        // 2. Insert new media if provided
        if (mediaFiles != null && !mediaFiles.isEmpty()) {
            int position = toUpdate.keepMediaIds() == null ? 1 : toUpdate.keepMediaIds().size() + 1;
            this.uploadStatusMediaBatch(statusId, mediaFiles, position);
        }
    }

    @Transactional
    public void updateStatusSettings(Long statusId, UpdateStatusSettings toUpdate) {
        this.statusRepository.updateStatusSettings(List.of(statusId), toUpdate);
        this.asyncUpdateRepliesSettings(statusId, toUpdate);
    }

    @Async
    @Transactional
    public void asyncUpdateRepliesSettings(Long parentStatusId, UpdateStatusSettings toUpdate) {
        List<Long> replies = this.statusRepository.getRepliesIds(parentStatusId);
        if (!replies.isEmpty()) {
            this.statusRepository.updateStatusSettings(replies, toUpdate);
        }
    }


    // Upload for statuses
    private void uploadStatusMediaBatch(Long statusId, List<MultipartFile> mediaFiles, int startPosition) throws Exception {
        // Collect new media to insert
        List<Long> newMediaIds = new ArrayList<>();
        List<MediaRepresentation> newAssets = new ArrayList<>();

        for (MultipartFile file : mediaFiles) {
            String hashedContent = MediaUtils.hashFileContent(file.getInputStream());
            Long mediaId = this.mediaService.findMediaIdsByHashes(Set.of(hashedContent)).get(hashedContent);

            // null means a new media asset, we skip it if it exists
            if (mediaId == null) {
                String hashedFileName = MediaUtils.hashFileName(file.getOriginalFilename());

                // Save to filesystem: uploads/<hashedFileName>.<ext>
                FileSystemUtils.saveFile(hashedFileName, file.getInputStream());

                // Prepare DB insert
                newAssets.add(new MediaRepresentation(hashedFileName, hashedContent, file.getContentType(), file.getSize()));
            }
        }

        // Bulk insert new media assets
        if (!newAssets.isEmpty()) {
            this.mediaService.insertMediaAssetsBatch(newAssets);
            Map<String, Long> mediaIdsByHashes = this.mediaService.findMediaIdsByHashes(newAssets.stream().map(MediaRepresentation::getContentHashed).collect(Collectors.toSet()));
            mediaIdsByHashes.forEach((_, v) -> newMediaIds.add(v));
        }

        // Bulk link status <-> media
        this.mediaService.addMediaToStatusBatch(statusId, newMediaIds, startPosition);
    }

    private void deleteStatusMedia(Long statusId) throws Exception {
        List<Long> mediaIdsToDelete = new ArrayList<>();
        List<MediaRepresentation> statusMediasByStatusId = this.mediaService.getStatusMediasByStatusId(statusId);
        deleteMediaAssetsIfNotReferenced(statusMediasByStatusId, mediaIdsToDelete);
    }

    private void deleteStatusMedia(Long statusId, List<Long> mediaIds) throws Exception {
        List<Long> mediaIdsToDelete = new ArrayList<>();
        List<MediaRepresentation> statusMediasByStatusId = this.mediaService.getStatusMediasByStatusIdAndMediaIds(statusId, mediaIds);
        deleteMediaAssetsIfNotReferenced(statusMediasByStatusId, mediaIdsToDelete);
    }

    private void deleteMediaAssetsIfNotReferenced(List<MediaRepresentation> statusMediasByStatusId, List<Long> mediaIdsToDelete) throws Exception {
        for (var mediaRepresentation : statusMediasByStatusId) {
            String hashedFileName = mediaRepresentation.getFileNameHashed();
            if (mediaRepresentation.getRefCount() == 1) {
                FileSystemUtils.deleteFile(hashedFileName);
                mediaIdsToDelete.add(mediaRepresentation.getMediaId());
            }
        }
        this.mediaService.deleteMediaAssets(mediaIdsToDelete);
    }


}
