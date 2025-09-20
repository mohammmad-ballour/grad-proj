package com.grad.social.common.model;

import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@Data
public class MediaRepresentation {
    private Long mediaId;
    private String fileNameHashed;
    private String contentHashed;
    private String mimeType;
    private long sizeInBytes;
    private int refCount;

    public MediaRepresentation(String fileNameHashed, String contentHashed, String mimeType, long sizeInBytes) {
        this.fileNameHashed = fileNameHashed;
        this.contentHashed = contentHashed;
        this.mimeType = mimeType;
        this.sizeInBytes = sizeInBytes;
    }
}
