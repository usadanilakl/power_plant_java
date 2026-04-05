package com.dk_power.power_plant_java.controller.hub;

import com.dk_power.power_plant_java.entities.hub.HubSyncedFile;
import com.dk_power.power_plant_java.sevice.hub.HubBulkImportService;
import com.dk_power.power_plant_java.sevice.hub.HubFileService;
import com.dk_power.power_plant_java.sevice.hub.HubResyncService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Hub resync controller — matches sync-server's FullResyncController API contract.
 * Provides endpoints for database export, file manifests, bulk import, and chunked upload.
 * Only active when sync.role=hub.
 */
@RestController
@RequestMapping("/api/resync")
@ConditionalOnProperty(name = "sync.role", havingValue = "hub")
@RequiredArgsConstructor
@Slf4j
public class HubResyncController {

    private final HubResyncService resyncService;
    private final HubFileService hubFileService;
    private final HubBulkImportService bulkImportService;
    private final com.dk_power.power_plant_java.sevice.sharepoint.SharePointSyncOrchestrator sharePointSyncOrchestrator;

    // ==================== Health & Export ====================

    @GetMapping("/health")
    public ResponseEntity<HubResyncService.ResyncHealth> getHealth() {
        log.info("Resync health check requested");
        return ResponseEntity.ok(resyncService.getHealth());
    }

    /**
     * Sync health endpoint for Angular frontend polling.
     * Hub is always in-sync with itself — returns a static healthy response.
     */
    @GetMapping("/sync-health")
    public ResponseEntity<Map<String, Object>> getSyncHealth() {
        return ResponseEntity.ok(Map.of(
            "syncStatus", "IN_SYNC",
            "message", "Hub mode - this instance is the sync source",
            "serverReachable", true,
            "entityDifference", 0,
            "fileDifference", 0,
            "suggestResync", false,
            "consecutiveOutOfSyncCount", 0,
            "checkTime", java.time.Instant.now().toString()
        ));
    }

    @PostMapping("/sync-health/check")
    public ResponseEntity<Map<String, Object>> forceSyncHealthCheck() {
        return getSyncHealth();
    }

    @GetMapping("/database/json")
    public ResponseEntity<Map<String, Object>> exportDatabaseJson() {
        log.info("Database JSON export requested");
        try {
            return ResponseEntity.ok(resyncService.exportDatabaseJson());
        } catch (Exception e) {
            log.error("Failed to export database: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/database/zip")
    public ResponseEntity<byte[]> exportDatabaseZip() {
        log.info("Database ZIP export requested");
        try {
            byte[] zipData = resyncService.exportDatabaseZip();
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=database_export.zip")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(zipData);
        } catch (Exception e) {
            log.error("Failed to export database as ZIP: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/database/h2-backup")
    public ResponseEntity<byte[]> downloadH2Backup() {
        log.info("H2 database backup requested — pausing SP sync");
        // Pause SharePoint sync during backup. H2 BACKUP TO needs a quiet DB —
        // concurrent SP writes cause it to hang waiting for locks.
        sharePointSyncOrchestrator.setClientSyncInProgress(true);
        try {
            byte[] backupData = resyncService.getLatestH2Backup();
            log.info("H2 backup complete, size={} bytes", backupData != null ? backupData.length : 0);
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=hub_backup.zip")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(backupData);
        } catch (Exception e) {
            log.error("Failed to create H2 backup: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } finally {
            sharePointSyncOrchestrator.setClientSyncInProgress(false);
        }
    }

    // ==================== File Manifests ====================

    @GetMapping("/files/manifest")
    public ResponseEntity<List<HubResyncService.FileManifestEntry>> getFileManifest() {
        log.info("File manifest requested");
        try {
            List<HubResyncService.FileManifestEntry> manifest = resyncService.getFileManifest();
            log.info("Returning manifest with {} files", manifest.size());
            return ResponseEntity.ok(manifest);
        } catch (Exception e) {
            log.error("Failed to get file manifest: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/files/path-manifest")
    public ResponseEntity<List<HubResyncService.PathBasedManifestEntry>> getPathBasedFileManifest() {
        log.info("Path-based file manifest requested");
        try {
            List<HubResyncService.PathBasedManifestEntry> manifest = resyncService.getPathBasedFileManifest();
            log.info("Returning path-based manifest with {} files", manifest.size());
            return ResponseEntity.ok(manifest);
        } catch (Exception e) {
            log.error("Failed to get path-based file manifest: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ==================== File Downloads ====================

    @GetMapping("/files/{fileId}")
    public ResponseEntity<Resource> downloadFile(
            @PathVariable Long fileId,
            @RequestHeader(value = "X-Machine-Id", required = false) String machineId) {
        try {
            Optional<HubSyncedFile> fileOpt = hubFileService.getFileById(fileId);
            if (fileOpt.isEmpty()) return ResponseEntity.notFound().build();

            HubSyncedFile syncedFile = fileOpt.get();
            Resource resource;
            if (machineId != null && !machineId.isEmpty()) {
                resource = hubFileService.loadFileForClient(fileId, machineId);
            } else {
                resource = hubFileService.loadFileForClient(fileId, "resync");
            }

            String contentType = syncedFile.getContentType() != null
                ? syncedFile.getContentType() : "application/octet-stream";

            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                    "attachment; filename=\"" + syncedFile.getFileName() + "\"")
                .header("X-File-Hash", syncedFile.getFileHash())
                .header("X-Original-Path", syncedFile.getOriginalPath() != null
                    ? syncedFile.getOriginalPath() : "")
                .contentType(MediaType.parseMediaType(contentType))
                .body(resource);
        } catch (Exception e) {
            log.error("Failed to download file {}: {}", fileId, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/files/entity/{entityType}/{entityId}")
    public ResponseEntity<List<HubSyncedFile>> getFilesForEntity(
            @PathVariable String entityType,
            @PathVariable Long entityId) {
        return ResponseEntity.ok(hubFileService.getFilesForEntity(entityType, entityId));
    }

    @GetMapping("/files/entity/{entityType}/{entityId}/{fileName}")
    public ResponseEntity<Resource> downloadFileByEntity(
            @PathVariable String entityType,
            @PathVariable Long entityId,
            @PathVariable String fileName,
            @RequestHeader(value = "X-Machine-Id", required = false) String machineId) {
        try {
            List<HubSyncedFile> files = hubFileService.getFilesForEntity(entityType, entityId);
            Optional<HubSyncedFile> match = files.stream()
                .filter(f -> fileName.equals(f.getFileName()))
                .findFirst();

            if (match.isEmpty()) return ResponseEntity.notFound().build();

            HubSyncedFile syncedFile = match.get();
            Resource resource = hubFileService.loadFileForClient(syncedFile.getId(),
                machineId != null ? machineId : "resync");

            String contentType = syncedFile.getContentType() != null
                ? syncedFile.getContentType() : "application/octet-stream";

            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                    "attachment; filename=\"" + syncedFile.getFileName() + "\"")
                .contentType(MediaType.parseMediaType(contentType))
                .body(resource);
        } catch (Exception e) {
            log.error("Failed to download file {}/{}/{}: {}", entityType, entityId, fileName, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/files/permanent/**")
    public ResponseEntity<Resource> downloadFromPermanentStorage(
            HttpServletRequest request,
            @RequestHeader(value = "X-Machine-Id", required = false) String machineId) {

        String fullPath = request.getRequestURI();
        int permanentIndex = fullPath.indexOf("/files/permanent/");
        if (permanentIndex < 0) return ResponseEntity.badRequest().build();

        String relativePath = fullPath.substring(permanentIndex + 17);

        String decodedPath = relativePath;
        try {
            decodedPath = java.net.URLDecoder.decode(relativePath, "UTF-8");
            if (decodedPath.contains("%")) {
                decodedPath = java.net.URLDecoder.decode(decodedPath, "UTF-8");
            }
        } catch (Exception e) {
            log.warn("Failed to decode path: {}", relativePath);
        }

        log.debug("Permanent file download: {} -> {} (machine: {})", relativePath, decodedPath, machineId);

        Optional<byte[]> content = resyncService.loadFromUploads(decodedPath);
        if (content.isEmpty() && !decodedPath.equals(relativePath)) {
            content = resyncService.loadFromUploads(relativePath);
        }

        if (content.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        String fileName = Paths.get(decodedPath).getFileName().toString();
        String contentType = determineContentType(fileName);
        ByteArrayResource resource = new ByteArrayResource(content.get());

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
            .contentType(MediaType.parseMediaType(contentType))
            .contentLength(content.get().length)
            .body(resource);
    }

    // ==================== Bulk Import ====================

    @GetMapping("/import/safety-check")
    public ResponseEntity<HubBulkImportService.SafetyCheckResult> checkImportSafety(
            @RequestParam(defaultValue = "false") boolean force) {
        log.info("Import safety check requested (force={})", force);
        return ResponseEntity.ok(bulkImportService.checkImportSafety(force));
    }

    @PostMapping("/import/database")
    public ResponseEntity<HubBulkImportService.ImportResult> importDatabase(
            @RequestParam("file") MultipartFile file,
            @RequestHeader("X-Machine-Id") String machineId,
            @RequestParam(defaultValue = "false") boolean force) {
        log.info("Database import requested from {} (force={}, size={})", machineId, force, file.getSize());
        try {
            HubBulkImportService.ImportResult result = bulkImportService.importDatabaseBackup(
                file.getBytes(), machineId, force);
            return result.isSuccess() ? ResponseEntity.ok(result) : ResponseEntity.badRequest().body(result);
        } catch (Exception e) {
            log.error("Database import failed: {} ({})", e.getMessage(), e.getClass().getName(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(HubBulkImportService.ImportResult.builder()
                    .success(false).message("Import failed: " + e.getClass().getSimpleName() + ": " + e.getMessage()).build());
        }
    }

    @PostMapping("/import/files")
    public ResponseEntity<HubBulkImportService.ImportResult> importFiles(
            @RequestParam("file") MultipartFile file,
            @RequestHeader("X-Machine-Id") String machineId) {
        log.info("Files import requested from {} (size={})", machineId, file.getSize());
        try {
            HubBulkImportService.ImportResult result = bulkImportService.importFilesArchive(
                file.getBytes(), machineId);
            return result.isSuccess() ? ResponseEntity.ok(result) : ResponseEntity.badRequest().body(result);
        } catch (IOException e) {
            log.error("Files import failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(HubBulkImportService.ImportResult.builder()
                    .success(false).message("Import failed: " + e.getMessage()).build());
        }
    }

    @PostMapping("/import/full")
    public ResponseEntity<HubBulkImportService.ImportResult> importFull(
            @RequestParam("database") MultipartFile database,
            @RequestParam("files") MultipartFile files,
            @RequestHeader("X-Machine-Id") String machineId,
            @RequestParam(defaultValue = "false") boolean force) {
        log.info("Full import requested from {} (force={}, db={}bytes, files={}bytes)",
            machineId, force, database.getSize(), files.getSize());
        try {
            HubBulkImportService.ImportResult result = bulkImportService.importFull(
                database.getBytes(), files.getBytes(), machineId, force);
            return result.isSuccess() ? ResponseEntity.ok(result) : ResponseEntity.badRequest().body(result);
        } catch (Exception e) {
            log.error("Full import failed: {} ({})", e.getMessage(), e.getClass().getSimpleName(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(HubBulkImportService.ImportResult.builder()
                    .success(false).message("Import failed (" + e.getClass().getSimpleName() + "): " + e.getMessage()).build());
        }
    }

    // ==================== Chunked Upload ====================

    @PostMapping("/import/files/init")
    public ResponseEntity<HubBulkImportService.ChunkedUploadInit> initChunkedUpload(
            @RequestHeader("X-Machine-Id") String machineId,
            @RequestParam long totalSize,
            @RequestParam int totalChunks) {
        HubBulkImportService.ChunkedUploadInit result = bulkImportService.initChunkedUpload(
            machineId, totalSize, totalChunks);
        return result.isSuccess() ? ResponseEntity.ok(result) : ResponseEntity.badRequest().body(result);
    }

    @PostMapping("/import/files/chunk")
    public ResponseEntity<HubBulkImportService.ChunkedUploadChunkResult> uploadChunk(
            @RequestParam String uploadId,
            @RequestParam int chunkIndex,
            @RequestParam("chunk") MultipartFile chunk) {
        try {
            HubBulkImportService.ChunkedUploadChunkResult result = bulkImportService.uploadChunk(
                uploadId, chunkIndex, chunk.getBytes());
            return result.isSuccess() ? ResponseEntity.ok(result) : ResponseEntity.badRequest().body(result);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(HubBulkImportService.ChunkedUploadChunkResult.builder()
                    .success(false).message("Failed to read chunk: " + e.getMessage()).build());
        }
    }

    @PostMapping("/import/files/complete")
    public ResponseEntity<HubBulkImportService.ImportResult> completeChunkedUpload(
            @RequestParam String uploadId) {
        try {
            HubBulkImportService.ImportResult result = bulkImportService.completeChunkedUpload(uploadId);
            return result.isSuccess() ? ResponseEntity.ok(result) : ResponseEntity.badRequest().body(result);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(HubBulkImportService.ImportResult.builder()
                    .success(false).message("Failed to complete upload: " + e.getMessage()).build());
        }
    }

    @GetMapping("/import/files/status")
    public ResponseEntity<HubBulkImportService.ChunkedUploadStatus> getChunkedUploadStatus(
            @RequestParam String uploadId) {
        HubBulkImportService.ChunkedUploadStatus status = bulkImportService.getChunkedUploadStatus(uploadId);
        return status.isFound() ? ResponseEntity.ok(status) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/import/files/cancel")
    public ResponseEntity<Void> cancelChunkedUpload(@RequestParam String uploadId) {
        bulkImportService.cleanupChunkedUpload(uploadId);
        return ResponseEntity.ok().build();
    }

    // ==================== Helpers ====================

    private String determineContentType(String fileName) {
        String extension = "";
        int dotIndex = fileName.lastIndexOf('.');
        if (dotIndex > 0) {
            extension = fileName.substring(dotIndex + 1).toLowerCase();
        }
        return switch (extension) {
            case "pdf" -> "application/pdf";
            case "jpg", "jpeg" -> "image/jpeg";
            case "png" -> "image/png";
            case "gif" -> "image/gif";
            case "doc" -> "application/msword";
            case "docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            case "xls" -> "application/vnd.ms-excel";
            case "xlsx" -> "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            case "txt" -> "text/plain";
            case "json" -> "application/json";
            case "xml" -> "application/xml";
            default -> "application/octet-stream";
        };
    }
}
