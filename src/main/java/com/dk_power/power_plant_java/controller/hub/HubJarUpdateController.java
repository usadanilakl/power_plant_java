package com.dk_power.power_plant_java.controller.hub;

import com.dk_power.power_plant_java.sevice.hub.HubJarUpdateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;

/**
 * REST controller for JAR update distribution.
 * Matches sync-server's UpdateController API contract.
 * Only active when sync.role=hub.
 */
@RestController
@RequestMapping("/api/update")
@ConditionalOnProperty(name = "sync.role", havingValue = "hub")
@RequiredArgsConstructor
@Slf4j
public class HubJarUpdateController {

    private final HubJarUpdateService updateService;

    @GetMapping("/check")
    public ResponseEntity<?> checkForUpdate() {
        Optional<HubJarUpdateService.UpdateInfo> info = updateService.getLatestJarInfo();
        Optional<HubJarUpdateService.UpdatePolicy> policy = updateService.getUpdatePolicy();

        // 404 only when there is genuinely nothing to say — no JAR AND no directive. A files/db-only
        // directive is legitimate without a NEW jar (the current jar stays in the dir), so a present
        // policy alone keeps the response 200.
        if (info.isEmpty() && policy.isEmpty()) {
            log.debug("Update check: no JAR and no policy in updates directory");
            return ResponseEntity.notFound().build();
        }

        HubJarUpdateService.UpdateInfo updateInfo = info.orElse(null);
        HubJarUpdateService.UpdateCheckResponse response = new HubJarUpdateService.UpdateCheckResponse(
            updateInfo != null ? updateInfo.fileName() : null,
            updateInfo != null ? updateInfo.fileSize() : 0L,
            updateInfo != null ? updateInfo.checksum() : null,
            updateInfo != null ? updateInfo.lastModified() : null,
            policy.orElse(null)
        );

        log.info("Update check: jar={} policy={}",
            updateInfo != null
                ? updateInfo.fileName() + " (" + updateInfo.fileSize() / 1024 / 1024 + " MB, "
                    + updateInfo.checksum().substring(0, Math.min(12, updateInfo.checksum().length())) + "...)"
                : "none",
            policy.map(p -> p.id() + " " + p.actions()).orElse("none"));

        return ResponseEntity.ok(response);
    }

    @GetMapping("/download")
    public ResponseEntity<Resource> downloadUpdate() {
        Optional<Path> jarPath = updateService.getLatestJarPath();

        if (jarPath.isEmpty()) {
            log.warn("Download requested but no JAR available");
            return ResponseEntity.notFound().build();
        }

        Path jar = jarPath.get();
        try {
            long fileSize = Files.size(jar);
            String fileName = jar.getFileName().toString();

            Optional<HubJarUpdateService.UpdateInfo> info = updateService.getLatestJarInfo();
            String etag = info.map(i -> "\"" + i.checksum() + "\"").orElse(null);

            log.info("Streaming JAR download: {} ({} MB)", fileName, fileSize / 1024 / 1024);

            InputStreamResource resource = new InputStreamResource(Files.newInputStream(jar));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentDispositionFormData("attachment", fileName);
            headers.setContentLength(fileSize);
            headers.set(HttpHeaders.ACCEPT_RANGES, "bytes");
            if (etag != null) {
                headers.setETag(etag);
            }

            return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
        } catch (IOException e) {
            log.error("Error streaming JAR: {}", jar, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
