package com.dk_power.power_plant_java.sevice.angular.admin;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.file.FileRepo;
import com.dk_power.power_plant_java.repository.loto.LotoPointRepo;
import com.dk_power.power_plant_java.repository.sync.FieldChangeRepository;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.dk_power.power_plant_java.sevice.angular.refactor_equipment.EquipmentRefactorService;
import com.dk_power.power_plant_java.sevice.angular.permits.WorkAreaGitHubPublisher;
import com.dk_power.power_plant_java.sevice.sync.SyncContext;
import com.dk_power.power_plant_java.sevice.sync.FieldChangeTracker;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@Transactional
@RequiredArgsConstructor
public class AdminFunctionalitiesService {
    private final Logger logger = LoggerFactory.getLogger(AdminFunctionalitiesService.class);

    private final FileRepo fileRepo;
    private final LotoPointRepo lotoPointRepo;
    private final UserRepo userRepo;
    private final EquipmentRefactorService equipmentRefactorService;
    private final SyncContext syncContext;
    private final FieldChangeRepository fieldChangeRepository;
    private final FieldChangeTracker fieldChangeTracker;
    private final SyncConfig syncConfig;
    private final WorkAreaGitHubPublisher workAreaGitHubPublisher;

    // Hub-only (@ConditionalOnProperty sync.role=hub) — null on a desktop/client. Optional so the
    // (non-hub-conditional) admin service still wires everywhere.
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.dk_power.power_plant_java.sevice.hub.FieldChangeCompactor fieldChangeCompactor;

    @Value("${files.root.path}")
    private String filesRootPath;

    @Value("${project.root}")
    private String projectRootPath;

    // ============================================================
    // 1. Restore File Integrity
    // Iterates through folder structure and checks if corresponding
    // FileObject entities exist in the database
    // ============================================================

    public Map<String, Object> restoreFileIntegrity(boolean dryRun) {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, String>> orphanedFiles = new ArrayList<>();
        List<Map<String, String>> missingFiles = new ArrayList<>();
        List<Map<String, String>> restoredFiles = new ArrayList<>();
        int filesScanned = 0;
        int entitiesChecked = 0;

        try {
            Path uploadsPath = Paths.get(filesRootPath);

            if (!Files.exists(uploadsPath)) {
                result.put("error", "Uploads directory not found: " + uploadsPath);
                return result;
            }

            // Scan physical files and check for missing database entries
            try (Stream<Path> paths = Files.walk(uploadsPath)) {
                List<Path> files = paths
                    .filter(Files::isRegularFile)
                    .filter(p -> !p.getFileName().toString().startsWith("."))
                    .collect(Collectors.toList());

                for (Path filePath : files) {
                    filesScanned++;
                    String relativePath = uploadsPath.getParent().relativize(filePath).toString().replace("\\", "/");

                    // Parse the file path: uploads/extension/fileType/vendor/fileNumber.extension
                    FilePathInfo pathInfo = parseFilePath(relativePath);

                    if (pathInfo != null) {
                        // Check if FileObject exists in database
                        FileObject existingFile = fileRepo.findFirstByFileNumberOrderByIdAsc(pathInfo.fileNumber);

                        if (existingFile == null) {
                            Map<String, String> orphaned = new HashMap<>();
                            orphaned.put("path", relativePath);
                            orphaned.put("fileNumber", pathInfo.fileNumber);
                            orphaned.put("extension", pathInfo.extension);
                            orphaned.put("fileType", pathInfo.fileType);
                            orphaned.put("vendor", pathInfo.vendor);
                            orphanedFiles.add(orphaned);
                        }
                    }
                }
            }

            // Check database entries for missing physical files
            List<FileObject> allFileObjects = fileRepo.findAll();
            for (FileObject fo : allFileObjects) {
                entitiesChecked++;
                String fileLink = fo.getFileLink();
                if (fileLink != null) {
                    // Resolve fileLink (which includes baseLink prefix) against profile-specific path
                    String normalized = fileLink.replace("\\", "/");
                    int firstSlash = normalized.indexOf('/');
                    String relPath = firstSlash >= 0 ? normalized.substring(firstSlash + 1) : normalized;
                    Path physicalPath = Paths.get(filesRootPath).resolve(relPath);
                    if (!Files.exists(physicalPath)) {
                        Map<String, String> missing = new HashMap<>();
                        missing.put("id", fo.getId().toString());
                        missing.put("fileNumber", fo.getFileNumber());
                        missing.put("expectedPath", fileLink);
                        missing.put("name", fo.getName() != null ? fo.getName() : "N/A");
                        missingFiles.add(missing);
                    }
                }
            }

            result.put("filesScanned", filesScanned);
            result.put("entitiesChecked", entitiesChecked);
            result.put("orphanedFiles", orphanedFiles);
            result.put("orphanedCount", orphanedFiles.size());
            result.put("missingFiles", missingFiles);
            result.put("missingCount", missingFiles.size());
            result.put("restoredFiles", restoredFiles);
            result.put("dryRun", dryRun);
            result.put("success", true);

        } catch (Exception e) {
            logger.error("Error during file integrity check", e);
            result.put("error", e.getMessage());
            result.put("success", false);
        }

        return result;
    }

    private FilePathInfo parseFilePath(String relativePath) {
        // Expected format: uploads/extension/fileType/vendor/fileNumber.extension
        String[] parts = relativePath.split("/");
        if (parts.length >= 5) {
            FilePathInfo info = new FilePathInfo();
            // parts[0] = uploads (baseLink)
            info.extension = parts[1];
            info.fileType = parts[2];
            info.vendor = parts[3];

            String fileName = parts[parts.length - 1];
            int lastDotIndex = fileName.lastIndexOf('.');
            info.fileNumber = lastDotIndex != -1 ? fileName.substring(0, lastDotIndex) : fileName;

            return info;
        }
        return null;
    }

    private static class FilePathInfo {
        String extension;
        String fileType;
        String vendor;
        String fileNumber;
    }

    // ============================================================
    // 1b. Fix File Extensions
    // Scans the filesystem for each FileObject and sets the extensions
    // field based on which extension folders actually contain files
    // ============================================================

    public Map<String, Object> fixFileExtensions(boolean dryRun) {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> fixedFiles = new ArrayList<>();
        List<Map<String, Object>> errorFiles = new ArrayList<>();
        int totalChecked = 0;
        int totalFixed = 0;
        int alreadyCorrect = 0;

        try {
            Path uploadsPath = Paths.get(filesRootPath);
            if (!Files.exists(uploadsPath)) {
                result.put("error", "Uploads directory not found: " + uploadsPath);
                result.put("success", false);
                return result;
            }

            // Get all extension directories (pdf, jpg, dwg, etc.)
            List<String> availableExtensions;
            try (Stream<Path> extDirs = Files.list(uploadsPath)) {
                availableExtensions = extDirs
                    .filter(Files::isDirectory)
                    .map(p -> p.getFileName().toString())
                    .sorted()
                    .collect(Collectors.toList());
            }

            logger.info("Available extension folders: {}", availableExtensions);

            if (!dryRun) {
                syncContext.startSync();
            }
            try {
                List<FileObject> allFiles = fileRepo.findAll();
                for (FileObject fo : allFiles) {
                    totalChecked++;
                    if (fo.getFileNumber() == null || fo.getVendor() == null || fo.getFileType() == null) {
                        continue;
                    }

                    String vendorName = fo.getVendor().getName();
                    String fileTypeName = fo.getFileType().getName();
                    String fileNumber = fo.getFileNumber();

                    // Check each extension folder for files matching this fileNumber
                    Set<String> foundExtensions = new LinkedHashSet<>();
                    for (String ext : availableExtensions) {
                        Path folder = Paths.get(filesRootPath, ext, fileTypeName, vendorName);
                        if (Files.exists(folder)) {
                            try (Stream<Path> filesInDir = Files.list(folder)) {
                                boolean hasFile = filesInDir.anyMatch(p -> {
                                    String name = p.getFileName().toString();
                                    String baseName = name.contains(".")
                                        ? name.substring(0, name.lastIndexOf('.'))
                                        : name;
                                    // Match exact fileNumber or fileNumber-revN
                                    return baseName.equals(fileNumber)
                                        || baseName.matches("^" + java.util.regex.Pattern.quote(fileNumber) + "-rev\\d+$");
                                });
                                if (hasFile) {
                                    foundExtensions.add(ext);
                                }
                            }
                        }
                    }

                    String newExtensions = String.join(",", foundExtensions);
                    String currentExtensions = fo.getExtensions();
                    boolean needsFix = !newExtensions.equals(currentExtensions != null ? currentExtensions : "");

                    if (needsFix) {
                        totalFixed++;
                        Map<String, Object> fixed = new LinkedHashMap<>();
                        fixed.put("id", fo.getId());
                        fixed.put("fileNumber", fileNumber);
                        fixed.put("name", fo.getName() != null ? fo.getName() : "N/A");
                        fixed.put("oldExtensions", currentExtensions != null ? currentExtensions : "(null)");
                        fixed.put("newExtensions", newExtensions.isEmpty() ? "(none found)" : newExtensions);
                        fixedFiles.add(fixed);

                        if (!dryRun && !newExtensions.isEmpty()) {
                            fo.setExtensions(newExtensions);
                            // Also set singular extension to first found
                            fo.setExtension(foundExtensions.iterator().next());
                            fileRepo.save(fo);
                        }
                    } else {
                        alreadyCorrect++;
                    }
                }
            } finally {
                if (!dryRun) {
                    syncContext.endSync();
                }
            }

            result.put("success", true);
            result.put("dryRun", dryRun);
            result.put("totalChecked", totalChecked);
            result.put("totalFixed", totalFixed);
            result.put("alreadyCorrect", alreadyCorrect);
            result.put("availableExtensions", availableExtensions);
            result.put("fixedFiles", fixedFiles);
            result.put("errorFiles", errorFiles);

        } catch (Exception e) {
            logger.error("Error fixing file extensions", e);
            result.put("success", false);
            result.put("error", e.getMessage());
        }

        return result;
    }

    // ============================================================
    // 2. Split Equipment with Multiple LotoPoints
    // Delegates to existing EquipmentRefactorService
    // ============================================================

    /**
     * Split equipment with multiple loto points.
     * Runs inside SyncContext to bypass FieldChange tracking (one-time refactor operation).
     */
    public Map<String, Object> splitAllEquipmentWithMultipleLotoPoints() {
        Map<String, Object> result = new HashMap<>();
        try {
            // Run inside sync context to skip FieldChange creation
            // These are one-time refactor operations, not regular data changes
            syncContext.startSync();
            try {
                List<Equipment> splitEquipment = equipmentRefactorService.splitAllEquipmentWithMultipleLotoPoints();
                result.put("success", true);
                result.put("splitCount", splitEquipment.size());
                result.put("message", "Successfully split " + splitEquipment.size() + " equipment items (no sync records created)");

                // Return summary of split equipment
                List<Map<String, Object>> summary = splitEquipment.stream()
                    .map(eq -> {
                        Map<String, Object> item = new HashMap<>();
                        item.put("id", eq.getId());
                        item.put("tagNumber", eq.getTagNumber());
                        item.put("description", eq.getDescription());
                        return item;
                    })
                    .collect(Collectors.toList());
                result.put("splitEquipment", summary);
            } finally {
                syncContext.endSync();
            }

        } catch (Exception e) {
            logger.error("Error splitting equipment", e);
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        return result;
    }

    // ============================================================
    // 3. Assign Location, System, EqType, Vendor from Equipment to LotoPoint
    // Delegates to existing EquipmentRefactorService
    // ============================================================

    /**
     * Assign Location/EqType from Equipment to LotoPoints.
     * Runs inside SyncContext to bypass FieldChange tracking (one-time refactor operation).
     */
    public Map<String, Object> assignEquipmentAttributesToLotoPoints() {
        Map<String, Object> result = new HashMap<>();
        try {
            // Run inside sync context to skip FieldChange creation
            syncContext.startSync();
            try {
                // Get count before
                int beforeCount = countLotoPointsWithoutAttributes();

                equipmentRefactorService.assignEquipmentLocationAndTypeToLotoPoints();

                // Get count after
                int afterCount = countLotoPointsWithoutAttributes();

                result.put("success", true);
                result.put("message", "Successfully assigned equipment attributes to loto points (no sync records created)");
                result.put("pointsWithoutAttributesBefore", beforeCount);
                result.put("pointsWithoutAttributesAfter", afterCount);
                result.put("pointsUpdated", beforeCount - afterCount);
            } finally {
                syncContext.endSync();
            }

        } catch (Exception e) {
            logger.error("Error assigning equipment attributes", e);
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        return result;
    }

    private int countLotoPointsWithoutAttributes() {
        return (int) lotoPointRepo.findAll().stream()
            .filter(lp -> lp.getLocation() == null || lp.getEqType() == null)
            .count();
    }

    // ============================================================
    // 4. Associate LotoPoint with its counterpart (U1/U2)
    // Find all loto points with tag starting with 01, flip to 02,
    // find matching loto point, set counterpartId for both
    // ============================================================

    /**
     * Associate LotoPoints with their counterparts (U1/U2).
     * Runs inside SyncContext to bypass FieldChange tracking (one-time refactor operation).
     */
    public Map<String, Object> associateLotoPointCounterparts(boolean dryRun) {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> linkedPairs = new ArrayList<>();
        List<Map<String, Object>> skippedPoints = new ArrayList<>();
        int[] counts = {0, 0}; // processedCount, linkedCount

        try {
            // Run inside sync context to skip FieldChange creation when not dry run
            if (!dryRun) {
                syncContext.startSync();
            }
            try {
                // Find all loto points with tag number starting with "01"
                List<LotoPoint> unit1Points = lotoPointRepo.findAll().stream()
                    .filter(lp -> lp.getTagNumber() != null && lp.getTagNumber().startsWith("01"))
                    .filter(lp -> lp.getCounterpartId() == null) // Only process those not already linked
                    .collect(Collectors.toList());

                for (LotoPoint point1 : unit1Points) {
                    counts[0]++;
                    String tag1 = point1.getTagNumber();
                    String tag2 = "02" + tag1.substring(2); // Flip 01 to 02

                    // Find matching unit 2 loto point(s)
                    List<LotoPoint> matchingPoints = lotoPointRepo.findByTagNumber(tag2);

                    if (matchingPoints == null || matchingPoints.isEmpty()) {
                        Map<String, Object> skipped = new HashMap<>();
                        skipped.put("id", point1.getId());
                        skipped.put("tagNumber", tag1);
                        skipped.put("reason", "No matching counterpart found for tag: " + tag2);
                        skippedPoints.add(skipped);
                        continue;
                    }

                    if (matchingPoints.size() > 1) {
                        Map<String, Object> skipped = new HashMap<>();
                        skipped.put("id", point1.getId());
                        skipped.put("tagNumber", tag1);
                        skipped.put("reason", "Multiple counterparts found for tag: " + tag2 + " (count: " + matchingPoints.size() + ")");
                        skippedPoints.add(skipped);
                        continue;
                    }

                    LotoPoint point2 = matchingPoints.get(0);

                    if (point2.getCounterpartId() != null && !point2.getCounterpartId().equals(point1.getId())) {
                        Map<String, Object> skipped = new HashMap<>();
                        skipped.put("id", point1.getId());
                        skipped.put("tagNumber", tag1);
                        skipped.put("reason", "Counterpart " + tag2 + " already linked to another point (ID: " + point2.getCounterpartId() + ")");
                        skippedPoints.add(skipped);
                        continue;
                    }

                    List<LotoPoint> unit1Matches = lotoPointRepo.findByTagNumber(tag1);
                    if (unit1Matches.size() > 1) {
                        Map<String, Object> skipped = new HashMap<>();
                        skipped.put("id", point1.getId());
                        skipped.put("tagNumber", tag1);
                        skipped.put("reason", "Multiple loto points found with tag: " + tag1 + " (count: " + unit1Matches.size() + ")");
                        skippedPoints.add(skipped);
                        continue;
                    }

                    // All checks passed - link the counterparts
                    if (!dryRun) {
                        point1.setCounterpartId(point2.getId());
                        point2.setCounterpartId(point1.getId());
                        lotoPointRepo.save(point1);
                        lotoPointRepo.save(point2);
                    }

                    counts[1]++;
                    Map<String, Object> pair = new HashMap<>();
                    pair.put("point1Id", point1.getId());
                    pair.put("point1Tag", tag1);
                    pair.put("point2Id", point2.getId());
                    pair.put("point2Tag", tag2);
                    linkedPairs.add(pair);
                }
            } finally {
                if (!dryRun) {
                    syncContext.endSync();
                }
            }

            result.put("success", true);
            result.put("dryRun", dryRun);
            result.put("processedCount", counts[0]);
            result.put("linkedCount", counts[1]);
            result.put("skippedCount", skippedPoints.size());
            result.put("linkedPairs", linkedPairs);
            result.put("skippedPoints", skippedPoints);
            result.put("message", dryRun
                ? "Dry run completed. " + counts[1] + " pairs would be linked."
                : "Successfully linked " + counts[1] + " counterpart pairs (no sync records created).");

        } catch (Exception e) {
            logger.error("Error associating counterparts", e);
            result.put("success", false);
            result.put("error", e.getMessage());
        }

        return result;
    }

    // ============================================================
    // 5. Sync Queue Monitoring & Control
    // View pending FieldChanges, mark as synced, or clear queue
    // ============================================================

    public Map<String, Object> getSyncQueueStatus() {
        Map<String, Object> result = new LinkedHashMap<>();
        try {
            long totalChanges = fieldChangeRepository.countTotal();
            String myMachineId = syncConfig.getMachineId();
            String serverUrl = syncConfig.getSyncServerUrl();
            boolean isHub = syncConfig.isHubMode();

            result.put("success", true);
            result.put("totalChanges", totalChanges);
            result.put("machineId", myMachineId);
            result.put("machineName", syncConfig.getMachineName());
            result.put("syncRole", isHub ? "hub" : "peer");

            // Pending for SERVER (central sync)
            long pendingForServer = fieldChangeRepository.countPendingChangesFor("SERVER");
            result.put("pendingForServer", pendingForServer);
            result.put("serverUrl", serverUrl != null ? serverUrl : "not configured");

            // Breakdown by entity type
            List<Object[]> entityCounts = fieldChangeRepository.countByEntityType();
            List<Map<String, Object>> breakdown = new ArrayList<>();
            for (Object[] row : entityCounts) {
                Map<String, Object> entry = new LinkedHashMap<>();
                entry.put("entityType", row[0]);
                entry.put("count", row[1]);
                breakdown.add(entry);
            }
            result.put("byEntityType", breakdown);

            // Distinct origin machines
            List<String> originMachines = fieldChangeRepository.findDistinctOriginMachineIds();
            result.put("originMachines", originMachines);

            // Oldest and newest change timestamps
            var firstPage = fieldChangeRepository.findAll(PageRequest.of(0, 1, org.springframework.data.domain.Sort.by("timestamp").ascending()));
            var lastPage = fieldChangeRepository.findAll(PageRequest.of(0, 1, org.springframework.data.domain.Sort.by("timestamp").descending()));
            if (!firstPage.isEmpty()) {
                result.put("oldestChange", firstPage.getContent().get(0).getTimestamp().toString());
            }
            if (!lastPage.isEmpty()) {
                result.put("newestChange", lastPage.getContent().get(0).getTimestamp().toString());
            }

        } catch (Exception e) {
            logger.error("Error getting sync queue status", e);
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        return result;
    }

    public Map<String, Object> markAllSyncedToServer() {
        Map<String, Object> result = new HashMap<>();
        try {
            int marked = fieldChangeRepository.markAllChangesSyncedTo("SERVER");
            result.put("success", true);
            result.put("markedCount", marked);
            result.put("message", "Marked " + marked + " changes as synced to SERVER");
            logger.info("Admin: marked {} FieldChanges as synced to SERVER", marked);
        } catch (Exception e) {
            logger.error("Error marking changes as synced", e);
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        return result;
    }

    public Map<String, Object> markAllSyncedToMachine(String machineId) {
        Map<String, Object> result = new HashMap<>();
        try {
            int marked = fieldChangeRepository.markAllChangesSyncedTo(machineId);
            result.put("success", true);
            result.put("markedCount", marked);
            result.put("message", "Marked " + marked + " changes as synced to " + machineId);
            logger.info("Admin: marked {} FieldChanges as synced to {}", marked, machineId);
        } catch (Exception e) {
            logger.error("Error marking changes as synced to {}", machineId, e);
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        return result;
    }

    public Map<String, Object> clearOldChanges(int days) {
        Map<String, Object> result = new HashMap<>();
        try {
            Instant cutoff = Instant.now().minus(days, ChronoUnit.DAYS);
            int deleted = fieldChangeRepository.deleteChangesBefore(cutoff);
            result.put("success", true);
            result.put("deletedCount", deleted);
            result.put("message", "Deleted " + deleted + " changes older than " + days + " days");
            logger.info("Admin: deleted {} FieldChanges older than {} days", deleted, days);
        } catch (Exception e) {
            logger.error("Error clearing old changes", e);
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        return result;
    }

    /**
     * Run log compaction NOW (hub-only) instead of waiting for the nightly job — for testing/ops.
     * Reports FieldChange counts before/after so the collapse is visible. Synchronous: on a large
     * backlog it may take a moment.
     */
    public Map<String, Object> compactNow() {
        Map<String, Object> result = new HashMap<>();
        if (fieldChangeCompactor == null) {
            result.put("success", false);
            result.put("error", "Compaction is hub-only; this instance is not a hub.");
            return result;
        }
        long before = fieldChangeRepository.count();
        boolean active = fieldChangeCompactor.isActive();
        result.put("active", active);
        result.put("fieldChangeCountBefore", before);
        if (!active) {
            result.put("success", false);
            result.put("message", "Compaction is not active. It needs sync.hub.log-compaction-enabled + "
                    + "sync.hub.durable-apply-state-enabled + sync.hub.apply-lww-enabled all true "
                    + "(restart the hub to pick up flag changes).");
            return result;
        }
        long start = System.currentTimeMillis();
        fieldChangeCompactor.runCompaction();
        long after = fieldChangeRepository.count();
        result.put("success", true);
        result.put("fieldChangeCountAfter", after);
        result.put("deleted", before - after);
        result.put("durationMs", System.currentTimeMillis() - start);
        logger.info("Admin: compaction run — {} -> {} FieldChanges ({} removed) in {} ms",
                before, after, before - after, System.currentTimeMillis() - start);
        return result;
    }

    public Map<String, Object> clearAllChanges() {
        Map<String, Object> result = new HashMap<>();
        try {
            int deleted = fieldChangeRepository.deleteAllChanges();
            result.put("success", true);
            result.put("deletedCount", deleted);
            result.put("message", "Deleted all " + deleted + " FieldChanges");
            logger.info("Admin: deleted ALL {} FieldChanges", deleted);
        } catch (Exception e) {
            logger.error("Error clearing all changes", e);
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        return result;
    }

    /**
     * Regenerate missing CREATE history for existing User rows.
     * Local bootstrap admin users are machine-specific and intentionally unsynced, so
     * they are skipped unless explicitly requested.
     */
    public Map<String, Object> backfillUserCreateHistory(boolean dryRun, boolean includeLocalBootstrapUsers) {
        Map<String, Object> result = new LinkedHashMap<>();
        List<Map<String, Object>> candidates = new ArrayList<>();
        List<Map<String, Object>> repaired = new ArrayList<>();
        int usersScanned = 0;
        int skippedLocalBootstrap = 0;
        int alreadyHadCreateHistory = 0;
        int missingCreateHistory = 0;
        int usersBackfilled = 0;
        int fieldChangesCreated = 0;

        try {
            for (User user : userRepo.findAll()) {
                usersScanned++;

                if (!includeLocalBootstrapUsers && isLocalBootstrapUser(user)) {
                    skippedLocalBootstrap++;
                    continue;
                }

                boolean hasCreateMarker = fieldChangeRepository.existsByEntityTypeAndEntityIdAndChangeTypeAndFieldName(
                    "User", user.getId(), FieldChange.ChangeType.CREATE, "_entity_");
                if (hasCreateMarker) {
                    alreadyHadCreateHistory++;
                    continue;
                }

                missingCreateHistory++;
                addUserSummary(candidates, user, 50);

                if (!dryRun) {
                    List<FieldChange> changes = fieldChangeTracker.ensureCreateHistoryIfMissing(user);
                    if (!changes.isEmpty()) {
                        usersBackfilled++;
                        fieldChangesCreated += changes.size();
                        addUserSummary(repaired, user, 50);
                    }
                }
            }

            result.put("success", true);
            result.put("dryRun", dryRun);
            result.put("includeLocalBootstrapUsers", includeLocalBootstrapUsers);
            result.put("usersScanned", usersScanned);
            result.put("skippedLocalBootstrap", skippedLocalBootstrap);
            result.put("alreadyHadCreateHistory", alreadyHadCreateHistory);
            result.put("missingCreateHistory", missingCreateHistory);
            result.put("usersBackfilled", usersBackfilled);
            result.put("fieldChangesCreated", fieldChangesCreated);
            result.put("candidateSample", candidates);
            result.put("repairedSample", repaired);
            result.put("message", dryRun
                ? missingCreateHistory + " User row(s) are missing CREATE history"
                : "Backfilled " + usersBackfilled + " User row(s) with " + fieldChangesCreated + " FieldChange row(s)");
            logger.info("Admin: User create-history backfill dryRun={} scanned={} missing={} backfilled={} changesCreated={} skippedLocalBootstrap={}",
                dryRun, usersScanned, missingCreateHistory, usersBackfilled, fieldChangesCreated, skippedLocalBootstrap);
        } catch (Exception e) {
            logger.error("Error backfilling User create history", e);
            result.put("success", false);
            result.put("error", e.getMessage());
        }

        return result;
    }

    /**
     * Regenerate missing CREATE history for existing LotoPoint rows.
     * This is intended for targeted incident repair after client-assigned ids
     * were saved locally without the outbound CREATE marker and scalar fields.
     */
    public Map<String, Object> backfillLotoPointCreateHistory(boolean dryRun, String ids, Long minId) {
        Map<String, Object> result = new LinkedHashMap<>();
        List<Map<String, Object>> candidates = new ArrayList<>();
        List<Map<String, Object>> repaired = new ArrayList<>();
        List<Long> requestedIds = parseIdCsv(ids);
        int pointsScanned = 0;
        int skippedBelowMinId = 0;
        int alreadyHadCreateHistory = 0;
        int missingCreateHistory = 0;
        int pointsBackfilled = 0;
        int fieldChangesCreated = 0;

        try {
            List<LotoPoint> points = requestedIds.isEmpty()
                ? lotoPointRepo.findAll()
                : lotoPointRepo.findAllById(requestedIds);

            for (LotoPoint point : points) {
                pointsScanned++;

                if (minId != null && (point.getId() == null || point.getId() < minId)) {
                    skippedBelowMinId++;
                    continue;
                }

                boolean hasCreateMarker = fieldChangeRepository.existsByEntityTypeAndEntityIdAndChangeTypeAndFieldName(
                    "LotoPoint", point.getId(), FieldChange.ChangeType.CREATE, "_entity_");
                if (hasCreateMarker) {
                    alreadyHadCreateHistory++;
                    continue;
                }

                missingCreateHistory++;
                addLotoPointSummary(candidates, point, 50);

                if (!dryRun) {
                    List<FieldChange> changes = fieldChangeTracker.ensureCreateHistoryIfMissing(point);
                    if (!changes.isEmpty()) {
                        pointsBackfilled++;
                        fieldChangesCreated += changes.size();
                        addLotoPointSummary(repaired, point, 50);
                    }
                }
            }

            result.put("success", true);
            result.put("dryRun", dryRun);
            result.put("requestedIds", requestedIds);
            result.put("minId", minId);
            result.put("pointsScanned", pointsScanned);
            result.put("skippedBelowMinId", skippedBelowMinId);
            result.put("alreadyHadCreateHistory", alreadyHadCreateHistory);
            result.put("missingCreateHistory", missingCreateHistory);
            result.put("pointsBackfilled", pointsBackfilled);
            result.put("fieldChangesCreated", fieldChangesCreated);
            result.put("candidateSample", candidates);
            result.put("repairedSample", repaired);
            result.put("message", dryRun
                ? missingCreateHistory + " LotoPoint row(s) are missing CREATE history"
                : "Backfilled " + pointsBackfilled + " LotoPoint row(s) with " + fieldChangesCreated + " FieldChange row(s)");
            logger.info("Admin: LotoPoint create-history backfill dryRun={} requestedIds={} minId={} scanned={} missing={} backfilled={} changesCreated={}",
                dryRun, requestedIds.size(), minId, pointsScanned, missingCreateHistory, pointsBackfilled, fieldChangesCreated);
        } catch (Exception e) {
            logger.error("Error backfilling LotoPoint create history", e);
            result.put("success", false);
            result.put("error", e.getMessage());
        }

        return result;
    }

    private boolean isLocalBootstrapUser(User user) {
        String email = user.getEmail();
        return email != null && email.trim().toLowerCase(Locale.ROOT).endsWith("@localhost");
    }

    private void addUserSummary(List<Map<String, Object>> list, User user, int maxItems) {
        if (list.size() >= maxItems) {
            return;
        }
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", user.getId());
        item.put("username", user.getUsername());
        item.put("email", user.getEmail());
        item.put("windowsUsername", user.getWindowsUsername());
        item.put("name", user.getName());
        list.add(item);
    }

    private List<Long> parseIdCsv(String ids) {
        if (ids == null || ids.trim().isEmpty()) {
            return Collections.emptyList();
        }

        return Arrays.stream(ids.split(","))
            .map(String::trim)
            .filter(value -> !value.isEmpty())
            .map(Long::parseLong)
            .distinct()
            .collect(Collectors.toList());
    }

    private void addLotoPointSummary(List<Map<String, Object>> list, LotoPoint point, int maxItems) {
        if (list.size() >= maxItems) {
            return;
        }
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", point.getId());
        item.put("tagNumber", point.getTagNumber());
        item.put("description", point.getDescription());
        item.put("specificLocation", point.getSpecificLocation());
        item.put("normalPosition", point.getNormalPosition());
        item.put("isolatedPosition", point.getIsolatedPosition());
        list.add(item);
    }

    // ============================================================
    // 6. PWA Data Publishing
    // Manually publish work-area related static data to the PWA repo
    // ============================================================

    public Map<String, Object> publishPwaData(String target) {
        Map<String, Object> result = new LinkedHashMap<>();
        String normalized = target == null ? "all" : target.trim().toLowerCase(Locale.ROOT);

        switch (normalized) {
            case "areas" -> workAreaGitHubPublisher.publishAreas();
            case "map" -> workAreaGitHubPublisher.publishMap();
            case "categories" -> workAreaGitHubPublisher.publishCategories();
            case "fieldlisttypes" -> workAreaGitHubPublisher.publishFieldListTypes();
            case "inventorytypes" -> workAreaGitHubPublisher.publishInventoryTypes();
            case "locations" -> workAreaGitHubPublisher.publishLocations();
            case "lotopoints" -> workAreaGitHubPublisher.publishLotoPoints();
            case "sdschemicals" -> workAreaGitHubPublisher.publishSdsChemicals();
            case "all" -> workAreaGitHubPublisher.publishAll();
            default -> throw new IllegalArgumentException("Unsupported PWA publish target: " + target);
        }

        result.put("success", true);
        result.put("target", normalized);
        result.put("message", "Queued PWA publish for " + normalized);
        logger.info("Admin: queued PWA publish for {}", normalized);
        return result;
    }
}
