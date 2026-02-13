package com.dk_power.power_plant_java.controller.hub;

import com.dk_power.power_plant_java.sevice.hub.HubElectronUpdateService;
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
 * REST controller for Electron app update distribution.
 * Matches sync-server's ElectronUpdateController API contract.
 * Only active when sync.role=hub.
 */
@RestController
@RequestMapping("/api/electron-update")
@ConditionalOnProperty(name = "sync.role", havingValue = "hub")
@RequiredArgsConstructor
@Slf4j
public class HubElectronUpdateController {

    private final HubElectronUpdateService electronUpdateService;

    @GetMapping("/check")
    public ResponseEntity<?> checkForUpdate() {
        Optional<HubElectronUpdateService.ElectronUpdateInfo> info = electronUpdateService.getLatestZipInfo();

        if (info.isEmpty()) {
            log.debug("Electron update check: no ZIP found in electron-updates directory");
            return ResponseEntity.notFound().build();
        }

        HubElectronUpdateService.ElectronUpdateInfo updateInfo = info.get();
        log.info("Electron update check: {} ({} MB, checksum={}...)",
            updateInfo.fileName(),
            updateInfo.fileSize() / 1024 / 1024,
            updateInfo.checksum().substring(0, 12));

        return ResponseEntity.ok(updateInfo);
    }

    @GetMapping("/download")
    public ResponseEntity<Resource> downloadUpdate() {
        Optional<Path> zipPath = electronUpdateService.getLatestZipPath();

        if (zipPath.isEmpty()) {
            log.warn("Electron download requested but no ZIP available");
            return ResponseEntity.notFound().build();
        }

        Path zip = zipPath.get();
        try {
            long fileSize = Files.size(zip);
            String fileName = zip.getFileName().toString();

            Optional<HubElectronUpdateService.ElectronUpdateInfo> info = electronUpdateService.getLatestZipInfo();
            String etag = info.map(i -> "\"" + i.checksum() + "\"").orElse(null);

            log.info("Streaming Electron ZIP download: {} ({} MB)", fileName, fileSize / 1024 / 1024);

            InputStreamResource resource = new InputStreamResource(Files.newInputStream(zip));

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
            log.error("Error streaming Electron ZIP: {}", zip, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
