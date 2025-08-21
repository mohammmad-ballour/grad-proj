package com.grad.social.common.model;

import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@Data
public class MediaRepresentation {
    private Long mediaId;
    private String fileNameHashed;
    private String contentHashed;
    private String extension;
    private String mimeType;
    private long sizeInBytes;
    private int refCount;

    public MediaRepresentation(String fileNameHashed, String contentHashed, String extension, String mimeType, long sizeInBytes) {
        this.fileNameHashed = fileNameHashed;
        this.contentHashed = contentHashed;
        this.extension = extension;
        this.mimeType = mimeType;
        this.sizeInBytes = sizeInBytes;
    }
}
