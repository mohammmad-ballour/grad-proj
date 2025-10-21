package com.grad.social.service.status;

import com.grad.social.model.status.response.StatusResponse;
import com.grad.social.repository.status.BookmarkRepository;
import com.grad.social.repository.user.UserStatusInteractionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BookmarkService {
    private final UserStatusInteractionRepository userStatusInteractionRepository;
    private final BookmarkRepository bookmarkRepository;

    @Transactional
    public void saveBookmark(Long userId, Long statusId) {
        bookmarkRepository.insertBookmark(userId, statusId);
    }

    @Transactional
    public void removeBookmark(Long userId, Long statusId) {
        bookmarkRepository.deleteBookmark(userId, statusId);
    }

    @Transactional(readOnly = true)
    public List<StatusResponse> getUserBookmarks(Long userId, int offset) {
        return userStatusInteractionRepository.fetchBookmarks(userId, offset);
    }
}
