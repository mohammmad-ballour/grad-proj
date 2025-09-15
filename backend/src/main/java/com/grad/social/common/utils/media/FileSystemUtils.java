package com.grad.social.common.utils.media;

import com.grad.social.common.AppConstants;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.FileSystemResource;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Service
@Slf4j
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class FileSystemUtils {

    public static Path resolvePath(String hashedFileName) {
        String storagePath = AppConstants.UPLOAD_DIR;
        return Paths.get(storagePath, hashedFileName);
    }

    public static void saveFile(String hashedFileName, InputStream fileStream) throws Exception {
        Path target = resolvePath(hashedFileName);
        Files.createDirectories(target.getParent());
        long bytesWritten = Files.copy(fileStream, target, StandardCopyOption.REPLACE_EXISTING);
        if (bytesWritten > 0) {
            log.info("Saved file = %s".formatted(hashedFileName));
        }
    }

    public static FileSystemResource loadFile(String hashedFileName) {
        Path path = resolvePath(hashedFileName);
        return new FileSystemResource(path);
    }

    public static void deleteFile(String hashedFileName) throws Exception {
        Path path = resolvePath(hashedFileName);
        boolean b = Files.deleteIfExists(path);
        if (b) {
            log.info("Deleted file = %s".formatted(hashedFileName));
        }
    }

}
