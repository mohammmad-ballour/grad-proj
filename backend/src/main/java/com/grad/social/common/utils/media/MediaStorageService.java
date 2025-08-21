package com.grad.social.common.utils.media;

import com.grad.social.common.AppConstants;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Service
@Slf4j
public class MediaStorageService {

    public Path resolvePath(String hashedFileName, String extension) {
        String storagePath = AppConstants.UPLOAD_DIR;
        return Paths.get(storagePath, hashedFileName + "." + extension);
    }

    public void saveFile(String hashedFileName, String extension, InputStream fileStream) throws Exception {
        Path target = resolvePath(hashedFileName, extension);
        Files.createDirectories(target.getParent());
        long bytesWritten = Files.copy(fileStream, target, StandardCopyOption.REPLACE_EXISTING);
        if (bytesWritten > 0) {
            log.info("Saved file = %s".formatted(hashedFileName));
        }
    }

    public void deleteFile(String hashedFileName, String extension) throws Exception {
        Path path = resolvePath(hashedFileName, extension);
        boolean b = Files.deleteIfExists(path);
        if (b) {
            log.info("Deleted file = %s".formatted(hashedFileName));
        }
    }

}
