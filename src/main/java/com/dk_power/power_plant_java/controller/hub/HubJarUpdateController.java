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

        if (info.isEmpty()) {
            log.debug("Update check: no JAR found in updates directory");
            return ResponseEntity.notFound().build();
        }

        HubJarUpdateService.UpdateInfo updateInfo = info.get();
        log.info("Update check: {} ({} MB, checksum={}...)",
            updateInfo.fileName(),
            updateInfo.fileSize() / 1024 / 1024,
            updateInfo.checksum().substring(0, 12));

        return ResponseEntity.ok(updateInfo);
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
