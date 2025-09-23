package com.grad.social.controller.media;

import com.grad.social.common.model.MediaRepresentation;
import com.grad.social.service.media.MediaService;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.*;

@RestController
@RequestMapping("/media")
@RequiredArgsConstructor
public class MediaController {
    private final MediaService mediaService;

    @GetMapping("/{mediaId}")
    @SneakyThrows
    public ResponseEntity<Resource> getMedia(@PathVariable Long mediaId, @RequestHeader(value = "Range", required = false) String rangeHeader) {
        MediaRepresentation media = this.mediaService.getMediaById(mediaId);

        FileSystemResource fileSystemResource = mediaService.loadMedia(media.getFileNameHashed());
        long fileLength = fileSystemResource.contentLength();

        if (rangeHeader == null) {
            // no Range → return whole fileSystemResource
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(media.getMimeType()))
                    .contentLength(fileLength)
                    .body(fileSystemResource);
        }

        // Parse "Range: bytes=start-end"
        String[] ranges = rangeHeader.replace("bytes=", "").split("-");
        long start = Long.parseLong(ranges[0]);
        long end = (ranges.length > 1 && !ranges[1].isBlank())
                ? Long.parseLong(ranges[1])
                : fileLength - 1;

        if (end >= fileLength) {
            end = fileLength - 1;
        }

        long contentLength = end - start + 1;

        InputStream inputStream = new BufferedInputStream(new FileInputStream(fileSystemResource.getFile()));
        inputStream.skip(start);
        InputStreamResource resource = new InputStreamResource(new LimitedInputStream(inputStream, contentLength));
        return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                .contentType(MediaType.parseMediaType(media.getMimeType()))
                .header(HttpHeaders.CONTENT_RANGE, "bytes " + start + "-" + end + "/" + fileLength)
                .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                .contentLength(contentLength)
                .body(resource);
    }

    /**
     * Helper to limit the InputStream to a fixed length
     */
    private static class LimitedInputStream extends FilterInputStream {
        private long remaining;

        protected LimitedInputStream(InputStream in, long remaining) {
            super(in);
            this.remaining = remaining;
        }

        @Override
        public int read() throws IOException {
            if (remaining <= 0) return -1;
            int result = super.read();
            if (result != -1) remaining--;
            return result;
        }

        @Override
        public int read(byte[] b, int off, int len) throws IOException {
            if (remaining <= 0) return -1;
            len = (int) Math.min(len, remaining);
            int result = super.read(b, off, len);
            if (result != -1) remaining -= result;
            return result;
        }
    }
}