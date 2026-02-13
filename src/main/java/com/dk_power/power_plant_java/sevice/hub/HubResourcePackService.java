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
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Stream;

/**
 * Service for distributing resource packs (engraver_data, qa-data, etc.)
 * to field devices. Admin places directories under the configured base path;
 * clients fetch manifests and download individual files.
 * Only active when sync.role=hub.
 */
@Service
@ConditionalOnProperty(name = "sync.role", havingValue = "hub")
@Slf4j
public class HubResourcePackService {

    @Value("${resource-packs.base-path:${user.dir}/resource-packs}")
    private String basePath;

    private Path baseDir;

    private final ConcurrentHashMap<String, Map<String, CachedHash>> hashCache = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        baseDir = Paths.get(basePath).toAbsolutePath().normalize();
        try {
            Files.createDirectories(baseDir);
            log.info("Resource packs base directory: {}", baseDir);
        } catch (IOException e) {
            log.warn("Could not create resource-packs directory: {}", baseDir, e);
        }
    }

    public List<String> listPacks() {
        if (!Files.isDirectory(baseDir)) return Collections.emptyList();

        try (Stream<Path> dirs = Files.list(baseDir)) {
            return dirs
                .filter(Files::isDirectory)
                .map(p -> p.getFileName().toString())
                .sorted()
                .toList();
        } catch (IOException e) {
            log.error("Error listing resource packs: {}", baseDir, e);
            return Collections.emptyList();
        }
    }

    public Optional<List<PackFileEntry>> getManifest(String packName) {
        Path packDir = baseDir.resolve(packName).normalize();
        if (!packDir.startsWith(baseDir) || !Files.isDirectory(packDir)) {
            return Optional.empty();
        }

        Map<String, CachedHash> packCache = hashCache.computeIfAbsent(packName, k -> new ConcurrentHashMap<>());

        try (Stream<Path> files = Files.walk(packDir)) {
            List<PackFileEntry> entries = files
                .filter(Files::isRegularFile)
                .filter(p -> !p.getFileName().toString().startsWith("."))
                .map(p -> {
                    try {
                        String relativePath = packDir.relativize(p).toString().replace('\\', '/');
                        long fileSize = Files.size(p);
                        long mtime = Files.getLastModifiedTime(p).toMillis();
                        String hash = getCachedHash(packCache, relativePath, p, mtime);
                        String lastModified = Instant.ofEpochMilli(mtime).toString();
                        return new PackFileEntry(relativePath, hash, fileSize, lastModified);
                    } catch (IOException e) {
                        log.warn("Error reading file: {}", p, e);
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .toList();

            return Optional.of(entries);
        } catch (IOException e) {
            log.error("Error walking pack directory: {}", packDir, e);
            return Optional.empty();
        }
    }

    public Optional<Path> getFilePath(String packName, String relativePath) {
        Path packDir = baseDir.resolve(packName).normalize();
        if (!packDir.startsWith(baseDir)) return Optional.empty();

        Path filePath = packDir.resolve(relativePath).normalize();
        if (!filePath.startsWith(packDir)) return Optional.empty();
        if (!Files.isRegularFile(filePath)) return Optional.empty();

        return Optional.of(filePath);
    }

    private String getCachedHash(Map<String, CachedHash> cache, String key, Path filePath, long mtime) throws IOException {
        CachedHash cached = cache.get(key);
        if (cached != null && cached.mtime == mtime) {
            return cached.hash;
        }

        String hash = computeSha256(filePath);
        cache.put(key, new CachedHash(hash, mtime));
        return hash;
    }

    private String computeSha256(Path filePath) throws IOException {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            try (InputStream is = Files.newInputStream(filePath)) {
                byte[] buffer = new byte[65536];
                int read;
                while ((read = is.read(buffer)) != -1) {
                    digest.update(buffer, 0, read);
                }
            }
            return HexFormat.of().formatHex(digest.digest());
        } catch (Exception e) {
            throw new IOException("Failed to compute SHA-256 for " + filePath, e);
        }
    }

    public record PackFileEntry(String relativePath, String fileHash, long fileSize, String lastModified) {}

    private record CachedHash(String hash, long mtime) {}
}
