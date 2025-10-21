package com.grad.social.controller.status;

import com.grad.social.model.status.response.StatusResponse;
import com.grad.social.service.status.BookmarkService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookmarks")
@RequiredArgsConstructor
public class BookmarkController {

    private final BookmarkService bookmarkService;

    @PostMapping("/{statusId}")
    public ResponseEntity<Void> saveBookmark(@AuthenticationPrincipal Jwt jwt, @PathVariable Long statusId) {
        Long currentUserId = Long.valueOf(jwt.getClaimAsString("uid"));
        this.bookmarkService.saveBookmark(currentUserId, statusId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/{statusId}")
    public ResponseEntity<Void> removeBookmark(@AuthenticationPrincipal Jwt jwt, @PathVariable Long statusId) {
        Long currentUserId = Long.valueOf(jwt.getClaimAsString("uid"));
        this.bookmarkService.removeBookmark(currentUserId, statusId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<StatusResponse>> listBookmarks(@AuthenticationPrincipal Jwt jwt, @RequestParam(defaultValue = "0") int page) {
        Long currentUserId = Long.valueOf(jwt.getClaimAsString("uid"));
        return ResponseEntity.ok(this.bookmarkService.getUserBookmarks(currentUserId, page));
    }
}
