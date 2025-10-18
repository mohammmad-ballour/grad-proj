package com.grad.social.controller.status;

import com.grad.social.model.shared.TimestampSeekRequest;
import com.grad.social.model.status.request.CreateStatusRequest;
import com.grad.social.model.status.request.ReactToStatusRequest;
import com.grad.social.model.status.request.UpdateStatusContent;
import com.grad.social.model.status.request.UpdateStatusSettings;
import com.grad.social.model.status.response.ReplySnippet;
import com.grad.social.model.status.response.StatusWithRepliesResponse;
import com.grad.social.service.status.StatusService;
import com.grad.social.service.user.UserStatusInteractionService;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class StatusController {
    private final StatusService statusService;
    private final UserStatusInteractionService userStatusInteractionService;

    // Create/Share/Reply To status
    @PostMapping(value = "/status", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("@SecurityService.checkCanCreateStatus(#jwt, #toCreate)")
    @SneakyThrows
    public ResponseEntity<String> createStatus(@AuthenticationPrincipal Jwt jwt, @RequestPart("request") CreateStatusRequest toCreate,
                                               @RequestPart(value = "media", required = false) @Size(max = 4, message = "You can upload at most 4 media files") List<MultipartFile> mediaFiles) {
        Long uid = Long.parseLong(jwt.getClaimAsString("uid"));
        Long statusId = this.statusService.createStatus(uid, toCreate, mediaFiles);
        return ResponseEntity.status(HttpStatus.CREATED).body(String.valueOf(statusId));
    }

    // fetch status  (open endpoint)
    @GetMapping("/status/public/{statusId}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<StatusWithRepliesResponse> getStatusById(@AuthenticationPrincipal Jwt jwt, @PathVariable String statusId) {
        Long currentUserId = jwt == null? -1 : Long.parseLong(jwt.getClaimAsString("uid"));
        return ResponseEntity.ok(this.userStatusInteractionService.getStatusById(currentUserId, Long.parseLong(statusId)));
    }

    @PostMapping ("/status/{statusId}/replies")
    public ResponseEntity<List<ReplySnippet>> fetchMoreReplies(@AuthenticationPrincipal Jwt jwt, @PathVariable String statusId,
                                                               @RequestBody(required = false) TimestampSeekRequest seekRequest) {
        Long currentUserId = jwt == null? -1 : Long.parseLong(jwt.getClaimAsString("uid"));
        return ResponseEntity.ok(this.userStatusInteractionService.fetchMoreReplies(currentUserId, Long.parseLong(statusId), seekRequest));
    }

    @PutMapping("/status/{statusId}/update-audience")
    @PreAuthorize("@SecurityService.isStatusOwner(#jwt, #statusId) and @SecurityService.canChangeStatusSettings(#statusId, #toUpdate)")
    public void updateStatusSettings(@AuthenticationPrincipal Jwt jwt, @PathVariable Long statusId, @RequestBody UpdateStatusSettings toUpdate) {
        this.statusService.updateStatusSettings(statusId, toUpdate);
    }

    @PutMapping(value= "/status/{statusId}/update-content", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("@SecurityService.isStatusOwner(#jwt, #statusId)")
    @SneakyThrows
    public void updateStatusContent(@AuthenticationPrincipal Jwt jwt, @PathVariable Long statusId, @RequestPart(value = "request") UpdateStatusContent toUpdate,
                                    @RequestPart(value = "media", required = false) @Size(max = 4, message = "You can upload at most 4 media files") List<MultipartFile> mediaFiles) {
        this.statusService.updateStatusContent(statusId, toUpdate, mediaFiles);
    }


    // Delete a status
    @DeleteMapping("/status/{statusId}")
    @PreAuthorize("@SecurityService.isStatusOwner(#jwt, #statusId)")
    @SneakyThrows
    public ResponseEntity<Void> deleteStatus(@AuthenticationPrincipal Jwt jwt, @PathVariable Long statusId) {
        Long uid = Long.parseLong(jwt.getClaimAsString("uid"));
        this.statusService.deleteStatus(statusId);
        return ResponseEntity.noContent().build();
    }

    // Like a status
    @PostMapping("/like")
    @PreAuthorize("@SecurityService.canViewStatus(#jwt, #reactRequest)")
    public ResponseEntity<Void> likeStatus(@AuthenticationPrincipal Jwt jwt, @RequestBody ReactToStatusRequest reactRequest) {
        Long uid = Long.parseLong(jwt.getClaimAsString("uid"));
        this.userStatusInteractionService.likeStatus(uid, reactRequest);
        return ResponseEntity.ok().build();
    }

    // Unlike a status
    @PostMapping("/unlike")
    public ResponseEntity<Void> unlikeStatus(@AuthenticationPrincipal Jwt jwt, @RequestBody ReactToStatusRequest reactRequest) {
        Long uid = Long.parseLong(jwt.getClaimAsString("uid"));
        this.userStatusInteractionService.unlikeStatus(uid, reactRequest);
        return ResponseEntity.ok().build();
    }

}
