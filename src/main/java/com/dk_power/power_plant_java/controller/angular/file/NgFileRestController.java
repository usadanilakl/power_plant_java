package com.dk_power.power_plant_java.controller.angular.file;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.dto.files.FileIdDto;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.sevice.angular.file.NgFileService;
import com.dk_power.power_plant_java.sevice.angular.file.upload.UploadStrategyRegistry;
import com.dk_power.power_plant_java.sevice.file.TrashService;
import lombok.RequiredArgsConstructor;
import lombok.extern.java.Log;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/ng/files")
@RequiredArgsConstructor
public class NgFileRestController {
    private final NgFileService ngFileService;
    private final TrashService trashService;
    private final UploadStrategyRegistry uploadStrategyRegistry;
    private final Logger log = LoggerFactory.getLogger(NgFileRestController.class);
    @Value("${files.root.path}")
    private String rootPath;

    @GetMapping("/paginated")
    public ResponseEntity<NgApiResponse<Page<FileDto>>> getPaginatedFiles(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize) {

        try {
//            Page<FileObjectDto> paginatedFiles = fileService.getAll(page - 1, pageSize);
            Page<FileDto> paginatedFiles = ngFileService.findAllWithProjectionPaginated(
                    new ArrayList<>(Arrays.asList("id", "fileNumber", "name", "relatedSystems", "fileLink", "fileType.id", "fileType.name", "vendor.name", "vendor.id")),
                    PageRequest.of(page - 1, pageSize)).map(ngFileService::toDto);
            NgApiResponse<Page<FileDto>> response = new NgApiResponse<>(paginatedFiles, "Files retrieved successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
//            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping("/with-points")
    public ResponseEntity<NgApiResponse<Page<FileDto>>> getFilesWithPoints() {
        try {
            Page<FileDto> paginatedFiles = ngFileService.findAllWithProjectionPaginated(
                    new ArrayList<>(Arrays.asList("id", "fileNumber", "name", "vendor.name")),
                    PageRequest.of(0, 10000)).map(ngFileService::toDto);
            NgApiResponse<Page<FileDto>> response = new NgApiResponse<>(paginatedFiles, "Files retrieved successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

//    @GetMapping("/{id}")
//    public ResponseEntity<NgApiResponse<FileDto>> getFileById(@PathVariable Long id) {
//        try {
//            FileDto fileDto = ngFileService.findById(id).orElse(null);
//            if (fileDto == null) {
//                return ResponseEntity.notFound().build();
//            }
//            NgApiResponse<FileDto> response = new NgApiResponse<>(fileDto, "File retrieved successfully");
//            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
//        } catch (Exception e) {
//            e.printStackTrace();
//            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
//        }
//    }

    @GetMapping("/{id}")
    public ResponseEntity<NgApiResponse<FileDto>> getFileById(@PathVariable Long id) {
//        log.info("Received request for file with id: {}", id);
        try {
            long startTime = System.currentTimeMillis();
            Optional<FileDto> fileDtoOptional = ngFileService.findDtoById(id);
            long endTime = System.currentTimeMillis();
//            log.info("Time taken to fetch file: {} ms", endTime - startTime);

            if (fileDtoOptional.isEmpty()) {
//                log.warn("File with id {} not found", id);
                return ResponseEntity.notFound().build();
            }
            NgApiResponse<FileDto> response = new NgApiResponse<>(fileDtoOptional.get(), "File retrieved successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            log.error("Error retrieving file with id {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping("/search")
    public ResponseEntity<NgApiResponse<Page<FileDto>>> searchFiles(
            @RequestBody SearchCriteria criteria,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize) {
        try {
            Page<FileDto> searchResults;
            if (SearchCriteria.SearchType.GLOBAL.equals(criteria.getType()) && criteria.getQuery() != null && !criteria.getQuery().isEmpty()) {
                searchResults = ngFileService.complexSearch(criteria.getQuery(), page - 1, pageSize);
            } else {
                // Handles COLUMN, SORT, and any other type via complexSearchWithPagination
                String sortBy = criteria.getSortColumn() != null ? criteria.getSortColumn() : "fileNumber";
                String sortDir = criteria.getSortDirection() != null ? criteria.getSortDirection() : "ASC";
                Sort.Direction direction = Sort.Direction.fromString(sortDir);
                Page<FileObject> entityPage = ngFileService.complexSearchWithPagination(
                        ngFileService.getRepo(), criteria,
                        PageRequest.of(page - 1, pageSize, Sort.by(direction, sortBy)), true);
                searchResults = entityPage.map(ngFileService::toDtoLight);
            }
            NgApiResponse<Page<FileDto>> response = new NgApiResponse<>(searchResults, "Search completed successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping("/unique-values/{column}/filtered")
    public ResponseEntity<NgApiResponse<Page<String>>> getFilteredUniqueValues(
            @PathVariable String column,
            @RequestBody SearchCriteria criteria,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize,
            @RequestParam(defaultValue = "true") boolean andLogicEnabled) {
        try {
            Page<String> result = ngFileService.getFilteredUniqueValuesOfColumn(
                    ngFileService.getEntityManager(), ngFileService.getRepo(), FileObject.class,
                    column, criteria, PageRequest.of(page - 1, pageSize), andLogicEnabled);
            return ResponseEntity.ok(new NgApiResponse<>(result, "Unique values fetched"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    @PostMapping("/by-url")
    public ResponseEntity<NgApiResponse<FileDto>> getFileByUrl(@RequestBody Map<String, String> body) {
        String url = body.get("url");
        try {
            FileDto fileDto = ngFileService.findByFileLink(url);
            if (fileDto == null) {
                return ResponseEntity.notFound().build();
            }
            NgApiResponse<FileDto> response = new NgApiResponse<>(fileDto, "File retrieved successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PutMapping
    public ResponseEntity<NgApiResponse<Object>> updateFile(@RequestPart("fileDto") FileIdDto fileDto,
                                                            @RequestPart(value = "file", required = false) MultipartFile file,
                                                            @RequestParam(value = "overrideFile", defaultValue = "false") boolean overrideFile,
                                                            @RequestParam(value = "convertToJpg", required = false) Boolean convertToJpg) {

        try {
            Object responseObject = null;
            if (file != null) {
                responseObject = ngFileService.processPidFile(fileDto, file, overrideFile, convertToJpg);
            } else {
                responseObject = ngFileService.updateFileObject(fileDto);
            }
            return ResponseEntity.ok(new NgApiResponse<>(responseObject, "Files updated successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping("/check")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> checkFile(@RequestPart("fileDto") FileIdDto fileDto,
                                                                        @RequestPart("file") MultipartFile file) {
        try {
            FileObject fileEntity = ngFileService.convertIdDtoToEntity(fileDto);
            String extension = file.getOriginalFilename().substring(file.getOriginalFilename().lastIndexOf("."));
            fileDto.setExtension(extension);
            String fileLink = fileEntity.buildFolder();

            Map<String, Object> result = ngFileService.checkFileExists(fileLink);

            return ResponseEntity.ok(new NgApiResponse<>(result, "File check completed"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<NgApiResponse<Void>> deleteFile(@PathVariable Long id) {
        try {
            ngFileService.hardDelete(id);
            return ResponseEntity.ok(new NgApiResponse<>(null, "File deleted successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error deleting file: " + e.getMessage()));
        }
    }

    @GetMapping("/allowed-extensions")
    public ResponseEntity<NgApiResponse<List<String>>> getAllowedExtensions() {
        return ResponseEntity.ok(new NgApiResponse<>(uploadStrategyRegistry.allowedExtensions(),
                "Allowed extensions retrieved"));
    }

    /** Files whose extension matches any of the given values (e.g. ?extensions=stl,obj,3mf). */
    @GetMapping("/by-extensions")
    public ResponseEntity<NgApiResponse<List<FileDto>>> getByExtensions(
            @RequestParam String extensions) {
        try {
            List<String> extList = java.util.Arrays.stream(extensions.split(","))
                    .map(String::trim).filter(s -> !s.isEmpty()).toList();
            return ResponseEntity.ok(new NgApiResponse<>(ngFileService.findByExtensions(extList),
                    "Files retrieved"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * Start a background backfill of fileHash + perceptualHash for files that don't
     * have them. Returns immediately with the current state — poll {@code /backfill-hashes/status}
     * for progress. Safe to re-run; calling while a backfill is in progress returns the live state.
     */
    @PostMapping("/backfill-hashes")
    public ResponseEntity<NgApiResponse<NgFileService.BackfillState>> backfillHashes(
            @RequestParam(value = "limit", defaultValue = "0") int limit,
            @RequestParam(value = "recomputePerceptual", defaultValue = "false") boolean recomputePerceptual) {
        try {
            NgFileService.BackfillState state = ngFileService.startBackfillHashes(limit, recomputePerceptual);
            return ResponseEntity.ok(new NgApiResponse<>(state, "Backfill started"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /** Current state of the background hash backfill (running flag + counters). */
    @GetMapping("/backfill-hashes/status")
    public ResponseEntity<NgApiResponse<NgFileService.BackfillState>> backfillHashesStatus() {
        return ResponseEntity.ok(new NgApiResponse<>(ngFileService.getBackfillStatus(), "ok"));
    }

    /**
     * Generate the JPG derivative for a PDF FileObject if it's missing.
     * Returns the jpg fileLink so the caller can immediately load it.
     * Idempotent — calling again after generation is a no-op.
     */
    @PostMapping("/{id}/ensure-jpg")
    public ResponseEntity<NgApiResponse<Map<String, String>>> ensureJpg(@PathVariable Long id) {
        try {
            String jpgLink = ngFileService.ensureJpgExists(id);
            return ResponseEntity.ok(new NgApiResponse<>(Map.of("fileLink", jpgLink), "JPG ready"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * Pre-upload duplicate check by name tokens only.
     * Body: { "fileNumber": ["P-0001"] }
     * Returns name-token matches so the user can review before clicking Upload.
     */
    @PostMapping("/check-duplicates/by-name")
    public ResponseEntity<NgApiResponse<NgFileService.DuplicateReport>> checkDuplicatesByName(
            @RequestBody Map<String, Object> body) {
        try {
            @SuppressWarnings("unchecked")
            List<String> fileNumber = (List<String>) body.get("fileNumber");
            NgFileService.DuplicateReport report = ngFileService.findDuplicates(fileNumber, null, null, null, 0);
            return ResponseEntity.ok(new NgApiResponse<>(report, "ok"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * Post-upload duplicate check — reads hashes off the saved FileObject and
     * compares against the rest of the DB. Used for the "Possible duplicate
     * detected" toast with an Undo option.
     */
    @GetMapping("/{id}/check-duplicates")
    public ResponseEntity<NgApiResponse<NgFileService.DuplicateReport>> checkDuplicatesPostUpload(
            @PathVariable Long id,
            @RequestParam(value = "phashThreshold", defaultValue = "6") int phashThreshold) {
        try {
            FileObject f = ngFileService.getEntityById(id);
            if (f == null) {
                log.warn("[DupCheck] File id={} not found", id);
                return ResponseEntity.notFound().build();
            }
            List<String> fileNumber = f.getFileNumber() == null
                    ? List.of()
                    : java.util.Arrays.asList(f.getFileNumber().split("__SEP__"));
            log.info("[DupCheck] id={} fileNumber={} fileHash={} perceptualHash={}",
                    id, fileNumber,
                    f.getFileHash() == null ? "null" : f.getFileHash().substring(0, Math.min(12, f.getFileHash().length())) + "…",
                    f.getPerceptualHash() == null ? "null" : f.getPerceptualHash());
            NgFileService.DuplicateReport report = ngFileService.findDuplicates(
                    fileNumber, f.getFileHash(), f.getPerceptualHash(), id, phashThreshold);
            log.info("[DupCheck] id={} → exact={} visual={} name={}",
                    id, report.exactMatches.size(), report.visualMatches.size(), report.nameMatches.size());
            return ResponseEntity.ok(new NgApiResponse<>(report, "ok"));
        } catch (Exception e) {
            log.error("[DupCheck] failed for id=" + id, e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * Map of {@code <relative-folder>/<base-name> -> [physical revisions]} for every
     * on-disk document that has more than one revision (an original plus one or more
     * "-revN" siblings written by the Revise action). The client reproduces the key
     * from each row's fileLink to badge it and list its revisions. One filesystem
     * walk, cached client-side — no per-row scans.
     */
    @GetMapping("/revisions-map")
    public ResponseEntity<NgApiResponse<Map<String, List<NgFileService.RevisionInfo>>>> getRevisionsMap() {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(ngFileService.getRevisionsMap(),
                    "Revisions map retrieved"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /** Distinct fileType names actually used by FileObjects in the database. */
    @GetMapping("/distinct-types")
    public ResponseEntity<NgApiResponse<List<String>>> getDistinctFileTypes() {
        return ResponseEntity.ok(new NgApiResponse<>(ngFileService.getDistinctFileTypeNames(),
                "Distinct file types retrieved"));
    }

    @GetMapping("/by-type/{fileType}")
    public ResponseEntity<NgApiResponse<List<FileDto>>> getByFileType(@PathVariable String fileType) {
        try {
            List<FileDto> files = ngFileService.getByFileType(fileType, FileObject.lightDto);
            return ResponseEntity.ok(new NgApiResponse<>(files, "Files retrieved successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error retrieving files: " + e.getMessage()));
        }
    }

    /**
     * Upload multiple PDF files at once
     * All files share the same fileType and vendor
     * File number is derived from the original filename (without extension)
     * File name uses sharedFileName if provided, otherwise uses original filename
     */
    @PostMapping("/multi-upload")
    public ResponseEntity<NgApiResponse<List<FileDto>>> uploadMultipleFiles(
            @RequestPart("files") List<MultipartFile> files,
            @RequestParam("fileTypeId") Long fileTypeId,
            @RequestParam("vendorId") Long vendorId,
            @RequestParam(value = "sharedFileName", required = false) String sharedFileName,
            @RequestParam(value = "convertToJpg", required = false) Boolean convertToJpg) {
        try {
            if (files == null || files.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new NgApiResponse<>(null, "No files provided"));
            }

            // Per-file extension validation is done inside processMultipleFiles via
            // UploadStrategyRegistry; we just surface a clean up-front error if anything
            // has no filename at all.
            for (MultipartFile file : files) {
                if (file.getOriginalFilename() == null) {
                    return ResponseEntity.badRequest()
                            .body(new NgApiResponse<>(null, "File with no original filename rejected"));
                }
            }

            List<FileDto> uploadedFiles = ngFileService.processMultipleFiles(files, fileTypeId, vendorId, sharedFileName, convertToJpg);
            return ResponseEntity.ok(new NgApiResponse<>(uploadedFiles,
                    "Successfully uploaded " + uploadedFiles.size() + " files", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Error uploading files: " + e.getMessage()));
        }
    }

    @PostMapping("/eq-by-file")
    public ResponseEntity<NgApiResponse<List<EquipmentDto>>> getEquipmentByFile(@RequestBody Map<String, String> fileId) {
        try {
            List<EquipmentDto> equipmentDtos = ngFileService.getEquipmentByFile(fileId.get("id"));
            return ResponseEntity.ok(new NgApiResponse<>(equipmentDtos, "Equipment retrieved successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error retrieving equipment: " + e.getMessage()));
        }
    }


    @PostMapping("/file-by-link")
    public ResponseEntity<NgApiResponse<FileDto>> getEquipmentByFileLink(@RequestBody Map<String, String> body) {
        try {
            String fileLink = body.get("fileLink");
            if (fileLink == null || fileLink.isEmpty()) {
                return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "File link is required"));
            }

            FileDto fileDto = ngFileService.getFileByLink(fileLink);
            return ResponseEntity.ok(new NgApiResponse<>(fileDto, "File retrieved successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error retrieving file: " + e.getMessage()));
        }
    }

    // ==================== TRASH ENDPOINTS ====================

    /**
     * Get all files in trash.
     */
    @GetMapping("/trash")
    public ResponseEntity<NgApiResponse<List<TrashService.TrashEntry>>> listTrash() {
        try {
            List<TrashService.TrashEntry> entries = trashService.listTrash();
            return ResponseEntity.ok(new NgApiResponse<>(entries, "Trash retrieved successfully"));
        } catch (Exception e) {
            log.error("Error listing trash: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error listing trash: " + e.getMessage()));
        }
    }

    /**
     * Get trash statistics.
     */
    @GetMapping("/trash/stats")
    public ResponseEntity<NgApiResponse<TrashService.TrashStats>> getTrashStats() {
        try {
            TrashService.TrashStats stats = trashService.getStats();
            return ResponseEntity.ok(new NgApiResponse<>(stats, "Trash stats retrieved successfully"));
        } catch (Exception e) {
            log.error("Error getting trash stats: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error getting trash stats: " + e.getMessage()));
        }
    }

    /**
     * Restore a file from trash to its original location.
     */
    @PostMapping("/trash/{id}/restore")
    public ResponseEntity<Map<String, Object>> restoreFromTrash(@PathVariable String id) {
        try {
            boolean restored = trashService.restore(id);
            Map<String, Object> result = new HashMap<>();
            result.put("success", restored);
            result.put("message", restored ? "File restored successfully" : "File not found in trash");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error restoring from trash: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "success", false, "message", "Error restoring: " + e.getMessage()));
        }
    }

    /**
     * Permanently delete a file from trash.
     */
    @DeleteMapping("/trash/{id}")
    public ResponseEntity<Map<String, Object>> permanentlyDelete(@PathVariable String id) {
        try {
            boolean deleted = trashService.permanentlyDelete(id);
            return ResponseEntity.ok(Map.of(
                "success", deleted,
                "message", deleted ? "Permanently deleted" : "Not found in trash"));
        } catch (Exception e) {
            log.error("Error permanently deleting from trash: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "success", false, "message", "Error deleting: " + e.getMessage()));
        }
    }

    /**
     * Empty the entire trash (permanently delete all items).
     */
    @DeleteMapping("/trash")
    public ResponseEntity<Map<String, Object>> emptyTrash() {
        try {
            int count = trashService.emptyTrash();
            return ResponseEntity.ok(Map.of(
                "success", true,
                "deletedCount", count,
                "message", count + " files permanently deleted"));
        } catch (Exception e) {
            log.error("Error emptying trash: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "success", false, "message", "Error emptying trash: " + e.getMessage()));
        }
    }
}
