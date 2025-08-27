package com.grad.social.common.utils.media;

import com.grad.social.model.enums.MediaType;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

import static com.grad.social.model.enums.MediaType.*;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class MediaUtils {

    public static String hashFileContent(InputStream inputStream) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] buffer = new byte[8192];
        int n;
        while ((n = inputStream.read(buffer)) > 0) {
            digest.update(buffer, 0, n);
        }
        return HexFormat.of().formatHex(digest.digest());
    }

    public static String hashFileName(String originalFileName) throws Exception {
        if(originalFileName == null) {
            throw new IllegalArgumentException("Original name cannot be null");
        }
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hashedBytes = digest.digest(originalFileName.getBytes(StandardCharsets.UTF_8));
        return bytesToHex(hashedBytes);
    }

    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    public static String getExtension(String filename) {
        if(filename == null) return "";
        int idx = filename.lastIndexOf('.');
        return (idx == -1) ? "" : filename.substring(idx + 1);
    }

    public static MediaType getFileType(String contentType) {
        return switch (contentType) {
            case String s when s.startsWith("image/") -> IMAGE;
            case String s when s.startsWith("video/") -> VIDEO;
            case null, default -> MediaType.OTHER;
        };
    }
}