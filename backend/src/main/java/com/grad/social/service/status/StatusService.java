package com.grad.social.service.status;

import com.grad.social.common.exceptionhandling.AlreadyRegisteredException;
import com.grad.social.common.exceptionhandling.Model;
import com.grad.social.common.exceptionhandling.ModelNotFoundException;
import com.grad.social.common.model.MediaRepresentation;
import com.grad.social.common.utils.media.FileSystemUtils;
import com.grad.social.common.utils.media.MediaUtils;
import com.grad.social.exception.status.StatusErrorCode;
import com.grad.social.model.enums.ParentAssociation;
import com.grad.social.model.status.request.CreateStatusRequest;
import com.grad.social.repository.status.StatusRepository;
import com.grad.social.service.media.MediaService;
import com.grad.social.service.status.event.StatusPublishedEvent;
import com.grad.social.service.status.utils.StatusUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
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

    // currentUserId == statusOwnerId
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
//                    this.notificationService.saveNotification(currentUserId, new Long[]{parentStatusOwnerId}, savedStatusId, NotificationType.REPLY);
                } else if (parentAssociation == ParentAssociation.SHARE) {
//                    this.notificationService.saveNotification(currentUserId, new Long[]{parentStatusOwnerId}, savedStatusId, NotificationType.SHARE);
                }
            }
            List<String> mentions = StatusUtils.extractMentions(toCreate.content());
            if (!mentions.isEmpty()) {
                List<Long> mentionedUsersIds = this.statusRepository.validUsersInUsernames(mentions);
                // Send notifications to mentioned users
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
            // Use NotificationService to send a notification to the user
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


}
