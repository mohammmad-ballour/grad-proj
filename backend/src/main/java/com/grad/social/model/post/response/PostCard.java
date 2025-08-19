package com.grad.social.model.post.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.Instant;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class PostCard {
    private String content;
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private Instant postedAt;
    private Boolean isPinned;
}
