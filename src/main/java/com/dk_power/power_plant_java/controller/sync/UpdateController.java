package com.dk_power.power_plant_java.controller.sync;

import com.dk_power.power_plant_java.config.SyncConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.io.FileInputStream;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * REST controller for JAR update management.
 * Admin places new JARs in the configured updates directory;
 * Electron clients check and download updates from here.
 */
@RestController
@RequestMapping("/api/update")
@RequiredArgsConstructor
@Slf4j
public class UpdateController {

    private final SyncConfig syncConfig;

    // Cache the checksum to avoid recomputing for every request
    private String cachedChecksum;
    private long cachedChecksumFileSize;
    private long cachedChecksumLastModified;

    /**
     * Check if an update is available.
     * Returns JAR metadata (fileName, fileSize, checksum, lastModified).
     * Returns 404 if no JAR is available in the updates directory.
     *
     * GET /api/update/check
     */
    @GetMapping("/check")
    public ResponseEntity<Map<String, Object>> checkForUpdate() {
        File jarFile = getUpdateJarFile();

        if (jarFile == null || !jarFile.exists()) {
            return ResponseEntity.notFound().build();
        }

        Map<String, Object> info = new HashMap<>();
        info.put("fileName", jarFile.getName());
        info.put("fileSize", jarFile.length());
        info.put("lastModified", Instant.ofEpochMilli(jarFile.lastModified()).toString());
        info.put("checksum", computeChecksum(jarFile));

        return ResponseEntity.ok(info);
    }

    /**
     * Download the update JAR.
     * Supports HTTP Range header for resumable downloads.
     *
     * GET /api/update/download
     */
    @GetMapping("/download")
    public ResponseEntity<Resource> downloadUpdate(
            @RequestHeader(value = "Range", required = false) String rangeHeader) {

        File jarFile = getUpdateJarFile();

        if (jarFile == null || !jarFile.exists()) {
            return ResponseEntity.notFound().build();
        }

        long fileSize = jarFile.length();
        Resource resource = new FileSystemResource(jarFile);
        String checksum = computeChecksum(jarFile);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.setContentDisposition(ContentDisposition.attachment()
                .filename(jarFile.getName())
                .build());
        headers.setETag("\"" + checksum + "\"");
        headers.set("Accept-Ranges", "bytes");

        // Handle Range request for resumable downloads
        if (rangeHeader != null && rangeHeader.startsWith("bytes=")) {
            try {
                String range = rangeHeader.substring(6);
                String[] parts = range.split("-");
                long start = Long.parseLong(parts[0]);
                long end = parts.length > 1 && !parts[1].isEmpty()
                        ? Long.parseLong(parts[1])
                        : fileSize - 1;

                if (start >= fileSize) {
                    return ResponseEntity.status(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE)
                            .header("Content-Range", "bytes */" + fileSize)
                            .build();
                }

                long contentLength = end - start + 1;
                headers.setContentLength(contentLength);
                headers.set("Content-Range", "bytes " + start + "-" + end + "/" + fileSize);

                log.info("Serving update JAR range: bytes {}-{}/{} ({})", start, end, fileSize, jarFile.getName());

                return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                        .headers(headers)
                        .body(new RangeResource(resource, start, contentLength));
            } catch (Exception e) {
                log.warn("Invalid range header '{}': {}", rangeHeader, e.getMessage());
            }
        }

        // Full download
        headers.setContentLength(fileSize);
        log.info("Serving full update JAR: {} ({} bytes)", jarFile.getName(), fileSize);
        return ResponseEntity.ok()
                .headers(headers)
                .body(resource);
    }

    private File getUpdateJarFile() {
        String dir = syncConfig.getUpdateJarDirectory();
        String filename = syncConfig.getUpdateJarFilename();
        if (dir == null || filename == null) return null;

        File file = new File(dir, filename);
        return file.exists() ? file : null;
    }

    private synchronized String computeChecksum(File file) {
        // Return cached checksum if file hasn't changed
        if (cachedChecksum != null
                && file.length() == cachedChecksumFileSize
                && file.lastModified() == cachedChecksumLastModified) {
            return cachedChecksum;
        }

        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            try (FileInputStream fis = new FileInputStream(file)) {
                byte[] buffer = new byte[65536];
                int bytesRead;
                while ((bytesRead = fis.read(buffer)) != -1) {
                    digest.update(buffer, 0, bytesRead);
                }
            }
            byte[] hashBytes = digest.digest();
            StringBuilder sb = new StringBuilder();
            for (byte b : hashBytes) {
                sb.append(String.format("%02x", b));
            }
            cachedChecksum = sb.toString();
            cachedChecksumFileSize = file.length();
            cachedChecksumLastModified = file.lastModified();
            log.debug("Computed SHA-256 for {}: {}", file.getName(), cachedChecksum);
            return cachedChecksum;
        } catch (Exception e) {
            log.error("Failed to compute checksum for {}: {}", file.getName(), e.getMessage());
            return "";
        }
    }

    /**
     * Resource wrapper that serves a byte range from an underlying resource.
     */
    private static class RangeResource extends FileSystemResource {
        private final Resource delegate;
        private final long start;
        private final long length;

        public RangeResource(Resource delegate, long start, long length) {
            super(((FileSystemResource) delegate).getFile());
            this.delegate = delegate;
            this.start = start;
            this.length = length;
        }

        @Override
        public java.io.InputStream getInputStream() throws java.io.IOException {
            java.io.InputStream is = delegate.getInputStream();
            long skipped = is.skip(start);
            if (skipped < start) {
                is.close();
                throw new java.io.IOException("Could not skip to position " + start);
            }
            return new java.io.FilterInputStream(is) {
                private long remaining = length;

                @Override
                public int read() throws java.io.IOException {
                    if (remaining <= 0) return -1;
                    int b = super.read();
                    if (b != -1) remaining--;
                    return b;
                }

                @Override
                public int read(byte[] b, int off, int len) throws java.io.IOException {
                    if (remaining <= 0) return -1;
                    int toRead = (int) Math.min(len, remaining);
                    int n = super.read(b, off, toRead);
                    if (n > 0) remaining -= n;
                    return n;
                }
            };
        }

        @Override
        public long contentLength() {
            return length;
        }
    }
}
