package com.dk_power.power_plant_java.controller.hub;

import com.dk_power.power_plant_java.entities.hub.HubSyncedFile;
import com.dk_power.power_plant_java.sevice.hub.HubFileService;
import com.dk_power.power_plant_java.sevice.hub.HubSseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.NoSuchFileException;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Hub file REST controller — matches sync-server's FileController API contract.
 * Only active when sync.role=hub.
 */
@RestController
@RequestMapping("/api/files")
@ConditionalOnProperty(name = "sync.role", havingValue = "hub")
@RequiredArgsConstructor
@Slf4j
public class HubFileController {

    private final HubFileService hubFileService;
    private final HubSseService hubSseService;

    private static final long MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
    private static final int MAX_MISSING_FILE_WARNINGS = 10_000;
    private final Set<Long> warnedMissingFileIds = ConcurrentHashMap.newKeySet();

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(
            @RequestHeader("X-Machine-Id") String machineId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("entityType") String entityType,
            @RequestParam("entityId") Long entityId,
            @RequestParam(value = "originalPath", required = false) String originalPath) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File is empty", "success", false));
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "File too large. Maximum size: " + (MAX_FILE_SIZE / 1024 / 1024) + "MB",
                "success", false));
        }

        try {
            HubFileService.FileStoreResult result = hubFileService.storeFile(
                file, entityType, entityId, originalPath, machineId);

            HubSyncedFile syncedFile = result.syncedFile();

            if (result.isNewFile()) {
                log.info("File uploaded: {} for {}/{} from {}",
                    file.getOriginalFilename(), entityType, entityId, machineId);

                hubSseService.broadcastFileUpload(
                    entityType, entityId,
                    file.getOriginalFilename(),
                    syncedFile.getId(),
                    machineId);
            }

            return ResponseEntity.ok(toResponse(syncedFile));

        } catch (IOException e) {
            log.error("Failed to upload file: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Failed to store file: " + e.getMessage(), "success", false));
        }
    }

    @GetMapping("/download/{fileId}")
    public ResponseEntity<?> downloadFile(
            @PathVariable Long fileId,
            @RequestHeader("X-Machine-Id") String machineId) {

        try {
            Resource resource = hubFileService.loadFileForClient(fileId, machineId);
            HubSyncedFile syncedFile = hubFileService.getFileById(fileId).orElse(null);

            String contentType = (syncedFile != null && syncedFile.getContentType() != null)
                ? syncedFile.getContentType() : "application/octet-stream";
            String fileName = (syncedFile != null && syncedFile.getFileName() != null)
                ? syncedFile.getFileName() : "file";

            return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .body(resource);

        } catch (NoSuchFileException e) {
            // The metadata row exists, but its content is no longer present in hub storage.
            // Report a stable terminal status so clients do not retry this file forever.
            logMissingFileContent(fileId);
            return ResponseEntity.status(HttpStatus.GONE).body(Map.of(
                "error", "File content is no longer available",
                "code", "FILE_CONTENT_MISSING",
                "fileId", fileId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IOException e) {
            log.error("Failed to download file {}: {}", fileId, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Failed to read file: " + e.getMessage()));
        }
    }

    private void logMissingFileContent(Long fileId) {
        if (warnedMissingFileIds.add(fileId)) {
            // Keep the de-duplication set bounded. Clearing can cause an occasional repeat WARN,
            // but prevents a long-running hub from retaining every historical file ID forever.
            if (warnedMissingFileIds.size() > MAX_MISSING_FILE_WARNINGS) {
                warnedMissingFileIds.clear();
                warnedMissingFileIds.add(fileId);
            }
            log.warn("hub.file.content_missing fileId={}", fileId);
        } else {
            log.debug("Hub file content remains unavailable for fileId={}", fileId);
        }
    }

    @GetMapping("/pending")
    public ResponseEntity<?> getPendingFiles(@RequestHeader("X-Machine-Id") String machineId) {
        List<HubSyncedFile> pendingFiles = hubFileService.getFilesNotSyncedTo(machineId);
        long pendingCount = hubFileService.countFilesPendingFor(machineId);

        return ResponseEntity.ok(Map.of(
            "machineId", machineId,
            "pendingCount", pendingCount,
            "files", pendingFiles.stream().map(this::toResponse).toList()
        ));
    }

    @GetMapping("/entity/{entityType}/{entityId}")
    public ResponseEntity<?> getFilesForEntity(
            @PathVariable String entityType,
            @PathVariable Long entityId,
            @RequestHeader("X-Machine-Id") String machineId) {

        List<HubSyncedFile> files = hubFileService.getFilesForEntity(entityType, entityId);
        return ResponseEntity.ok(files.stream().map(this::toResponse).toList());
    }

    @GetMapping("/entity/{entityType}/{entityId}/download-info")
    public ResponseEntity<?> getDownloadInfo(
            @PathVariable String entityType,
            @PathVariable Long entityId,
            @RequestHeader("X-Machine-Id") String machineId) {

        List<HubSyncedFile> files = hubFileService.getFilesForEntity(entityType, entityId);

        List<Map<String, Object>> downloadInfo = files.stream().map(f -> Map.<String, Object>of(
            "id", f.getId(),
            "fileName", f.getFileName(),
            "extension", f.getExtension() != null ? f.getExtension() : "",
            "fileSize", f.getFileSize(),
            "fileHash", f.getFileHash(),
            "contentType", f.getContentType() != null ? f.getContentType() : "application/octet-stream",
            "originalPath", f.getOriginalPath() != null ? f.getOriginalPath() : "",
            "downloadUrl", "/api/files/download/" + f.getId()
        )).toList();

        return ResponseEntity.ok(Map.of(
            "entityType", entityType,
            "entityId", entityId,
            "fileCount", files.size(),
            "files", downloadInfo
        ));
    }

    @DeleteMapping("/entity/{entityType}/{entityId}")
    public ResponseEntity<?> deleteFilesForEntity(
            @PathVariable String entityType,
            @PathVariable Long entityId,
            @RequestHeader("X-Machine-Id") String machineId) {

        int deleted = hubFileService.deleteFilesForEntity(entityType, entityId);
        return ResponseEntity.ok(Map.of("success", true, "deletedCount", deleted));
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        HubFileService.StorageStats stats = hubFileService.getStats();
        return ResponseEntity.ok(Map.of(
            "totalBytesUsed", stats.totalBytesUsed(),
            "totalBytesMB", stats.totalBytesUsed() / (1024.0 * 1024.0),
            "totalFiles", stats.totalFiles()
        ));
    }

    private Map<String, Object> toResponse(HubSyncedFile sf) {
        return Map.ofEntries(
            Map.entry("id", sf.getId()),
            Map.entry("entityType", sf.getEntityType()),
            Map.entry("entityId", sf.getEntityId()),
            Map.entry("fileName", sf.getFileName() != null ? sf.getFileName() : ""),
            Map.entry("extension", sf.getExtension() != null ? sf.getExtension() : ""),
            Map.entry("fileSize", sf.getFileSize() != null ? sf.getFileSize() : 0L),
            Map.entry("fileHash", sf.getFileHash()),
            Map.entry("contentType", sf.getContentType() != null ? sf.getContentType() : "application/octet-stream"),
            Map.entry("originalPath", sf.getOriginalPath() != null ? sf.getOriginalPath() : ""),
            Map.entry("storagePath", sf.getStoragePath()),
            Map.entry("uploadedAt", sf.getUploadedAt() != null ? sf.getUploadedAt().toString() : ""),
            Map.entry("success", true)
        );
    }
}
