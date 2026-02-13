package com.dk_power.power_plant_java.sevice.hub;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Comparator;
import java.util.HexFormat;
import java.util.Optional;
import java.util.stream.Stream;

/**
 * Service for managing Electron app updates distributed to field devices.
 * Admin places new ZIPs in the configured directory; this service
 * scans for the latest one and serves it to Electron clients.
 * Only active when sync.role=hub.
 */
@Service
@ConditionalOnProperty(name = "sync.role", havingValue = "hub")
@Slf4j
public class HubElectronUpdateService {

    @Value("${electron-update.directory:${user.dir}/electron-updates}")
    private String zipDirectory;

    private Path zipDirPath;

    private String cachedChecksum;
    private long cachedMtime;
    private Path cachedZipPath;

    @PostConstruct
    public void init() {
        zipDirPath = Paths.get(zipDirectory).toAbsolutePath().normalize();
        try {
            Files.createDirectories(zipDirPath);
            log.info("Electron update ZIP directory: {}", zipDirPath);
        } catch (IOException e) {
            log.warn("Could not create electron-updates directory: {}", zipDirPath, e);
        }
    }

    public Optional<ElectronUpdateInfo> getLatestZipInfo() {
        Optional<Path> latestZip = findLatestZip();
        if (latestZip.isEmpty()) {
            return Optional.empty();
        }

        Path zipPath = latestZip.get();
        try {
            long fileSize = Files.size(zipPath);
            long mtime = Files.getLastModifiedTime(zipPath).toMillis();
            String checksum = getChecksum(zipPath, mtime);
            String lastModified = Instant.ofEpochMilli(mtime).toString();

            return Optional.of(new ElectronUpdateInfo(
                zipPath.getFileName().toString(),
                fileSize,
                checksum,
                lastModified
            ));
        } catch (IOException e) {
            log.error("Error reading ZIP metadata: {}", zipPath, e);
            return Optional.empty();
        }
    }

    public Optional<Path> getLatestZipPath() {
        return findLatestZip();
    }

    private Optional<Path> findLatestZip() {
        if (!Files.isDirectory(zipDirPath)) {
            return Optional.empty();
        }

        try (Stream<Path> files = Files.list(zipDirPath)) {
            return files
                .filter(p -> p.getFileName().toString().endsWith(".zip"))
                .filter(Files::isRegularFile)
                .max(Comparator.comparingLong(p -> {
                    try {
                        return Files.getLastModifiedTime(p).toMillis();
                    } catch (IOException e) {
                        return 0L;
                    }
                }));
        } catch (IOException e) {
            log.error("Error scanning electron-updates directory: {}", zipDirPath, e);
            return Optional.empty();
        }
    }

    private String getChecksum(Path zipPath, long mtime) throws IOException {
        if (cachedChecksum != null && cachedMtime == mtime && zipPath.equals(cachedZipPath)) {
            return cachedChecksum;
        }

        log.info("Computing SHA-256 for: {} ({} MB)", zipPath.getFileName(),
            Files.size(zipPath) / 1024 / 1024);

        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            try (InputStream is = Files.newInputStream(zipPath)) {
                byte[] buffer = new byte[65536];
                int read;
                while ((read = is.read(buffer)) != -1) {
                    digest.update(buffer, 0, read);
                }
            }
            cachedChecksum = HexFormat.of().formatHex(digest.digest());
            cachedMtime = mtime;
            cachedZipPath = zipPath;
            return cachedChecksum;
        } catch (Exception e) {
            throw new IOException("Failed to compute checksum", e);
        }
    }

    public record ElectronUpdateInfo(String fileName, long fileSize, String checksum, String lastModified) {}
}
