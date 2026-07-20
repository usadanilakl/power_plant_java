package com.dk_power.power_plant_java.sevice.hub;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

/**
 * Service for managing JAR updates distributed to field devices.
 * Admin places new JARs in the configured directory; this service
 * scans for the latest one and serves it to clients.
 * Only active when sync.role=hub.
 */
@Service
@ConditionalOnProperty(name = "sync.role", havingValue = "hub")
@Slf4j
public class HubJarUpdateService {

    @Value("${update.jar.directory:${user.dir}/updates}")
    private String jarDirectory;

    /** Admin-editable directive that sits next to the JAR in the updates dir. */
    private static final String POLICY_FILE = "update-policy.json";
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private Path jarDirPath;

    private String cachedChecksum;
    private long cachedMtime;
    private Path cachedJarPath;

    @PostConstruct
    public void init() {
        jarDirPath = Paths.get(jarDirectory).toAbsolutePath().normalize();
        try {
            Files.createDirectories(jarDirPath);
            log.info("Update JAR directory: {}", jarDirPath);
        } catch (IOException e) {
            log.warn("Could not create updates directory: {}", jarDirPath, e);
        }
    }

    public Optional<UpdateInfo> getLatestJarInfo() {
        Optional<Path> latestJar = findLatestJar();
        if (latestJar.isEmpty()) {
            return Optional.empty();
        }

        Path jarPath = latestJar.get();
        try {
            long fileSize = Files.size(jarPath);
            long mtime = Files.getLastModifiedTime(jarPath).toMillis();
            String checksum = getChecksum(jarPath, mtime);
            String lastModified = Instant.ofEpochMilli(mtime).toString();

            return Optional.of(new UpdateInfo(
                jarPath.getFileName().toString(),
                fileSize,
                checksum,
                lastModified
            ));
        } catch (IOException e) {
            log.error("Error reading JAR metadata: {}", jarPath, e);
            return Optional.empty();
        }
    }

    public Optional<Path> getLatestJarPath() {
        return findLatestJar();
    }

    /**
     * Read the admin-set update directive ({@code update-policy.json} in the updates dir), if present.
     * Absent file / parse error / missing required fields → empty (the update stays JAR-checksum-only,
     * i.e. the pre-existing behaviour). Never throws.
     */
    public Optional<UpdatePolicy> getUpdatePolicy() {
        Path policyPath = jarDirPath.resolve(POLICY_FILE);
        if (!Files.isRegularFile(policyPath)) {
            return Optional.empty();
        }
        try {
            UpdatePolicy policy = MAPPER.readValue(Files.readAllBytes(policyPath), UpdatePolicy.class);
            if (policy.id() == null || policy.id().isBlank()
                    || policy.actions() == null || policy.actions().isEmpty()) {
                log.warn("{} present but missing 'id' or 'actions' — ignoring", policyPath);
                return Optional.empty();
            }
            return Optional.of(policy);
        } catch (IOException e) {
            log.warn("Failed to read/parse {}: {}", policyPath, e.getMessage());
            return Optional.empty();
        }
    }

    private Optional<Path> findLatestJar() {
        if (!Files.isDirectory(jarDirPath)) {
            return Optional.empty();
        }

        try (Stream<Path> files = Files.list(jarDirPath)) {
            return files
                .filter(p -> p.getFileName().toString().endsWith(".jar"))
                .filter(Files::isRegularFile)
                .max(Comparator.comparingLong(p -> {
                    try {
                        return Files.getLastModifiedTime(p).toMillis();
                    } catch (IOException e) {
                        return 0L;
                    }
                }));
        } catch (IOException e) {
            log.error("Error scanning updates directory: {}", jarDirPath, e);
            return Optional.empty();
        }
    }

    private String getChecksum(Path jarPath, long mtime) throws IOException {
        if (cachedChecksum != null && cachedMtime == mtime && jarPath.equals(cachedJarPath)) {
            return cachedChecksum;
        }

        log.info("Computing SHA-256 for: {} ({} MB)", jarPath.getFileName(),
            Files.size(jarPath) / 1024 / 1024);

        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            try (InputStream is = Files.newInputStream(jarPath)) {
                byte[] buffer = new byte[65536];
                int read;
                while ((read = is.read(buffer)) != -1) {
                    digest.update(buffer, 0, read);
                }
            }
            cachedChecksum = HexFormat.of().formatHex(digest.digest());
            cachedMtime = mtime;
            cachedJarPath = jarPath;
            return cachedChecksum;
        } catch (Exception e) {
            throw new IOException("Failed to compute checksum", e);
        }
    }

    public record UpdateInfo(String fileName, long fileSize, String checksum, String lastModified) {}

    /**
     * Admin-set rollout directive. {@code actions} is any subset of ["jar","db","files"]; the client
     * applies them in the fixed safe order jar → db (via smart-resync) → files, and records {@code id}
     * once applied so a db/files action runs exactly once. {@code mandatory} skips the "Later" option.
     */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record UpdatePolicy(String id, List<String> actions, boolean mandatory, String message) {}

    /**
     * Combined /check payload: the JAR fields stay at the top level (so the existing client keeps
     * working unchanged) with the optional {@code policy} alongside.
     */
    public record UpdateCheckResponse(String fileName, long fileSize, String checksum,
                                      String lastModified, UpdatePolicy policy) {}
}
