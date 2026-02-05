package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.categories.Category;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.entities.loto.LotoStandard;
import com.dk_power.power_plant_java.repository.categories.CategoryRepo;
import com.dk_power.power_plant_java.repository.categories.ValueRepo;
import com.dk_power.power_plant_java.repository.equipment.EquipmentRepo;
import com.dk_power.power_plant_java.repository.file.FileRepo;
import com.dk_power.power_plant_java.repository.loto.LotoPointRepo;
import com.dk_power.power_plant_java.repository.loto.LotoStandardRepo;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class SyncE2EFileTestService {

    private final CategoryRepo categoryRepo;
    private final ValueRepo valueRepo;
    private final EquipmentRepo equipmentRepo;
    private final LotoPointRepo lotoPointRepo;
    private final LotoStandardRepo lotoStandardRepo;
    private final FileRepo fileRepo;
    private final SyncContext syncContext;

    @PersistenceContext
    private EntityManager entityManager;

    @org.springframework.beans.factory.annotation.Value("${project.root:}")
    private String projectRootPath;

    // ==================== SEED FILE ENTITY GRAPH ====================

    @Transactional
    public Map<String, Object> seedFileEntityGraph(String prefix, int iterations) {
        long start = System.currentTimeMillis();

        List<Long> fileObjectIds = new ArrayList<>();
        List<Long> equipmentIds = new ArrayList<>();
        List<Long> lotoPointIds = new ArrayList<>();
        List<Long> lotoStandardIds = new ArrayList<>();
        List<String> filesOnDisk = new ArrayList<>();
        Map<String, Long> fileTypeValueIds = new LinkedHashMap<>();
        Map<String, Long> vendorValueIds = new LinkedHashMap<>();

        // Step 1: Create shared Categories + Values (only once, reused across iterations)
        // File Type category
        Category fileTypeCat = new Category(prefix + "_File Type");
        fileTypeCat.setName(prefix + "_File Type");
        fileTypeCat.setCreatedBy("sync-e2e-test");
        fileTypeCat = categoryRepo.save(fileTypeCat);

        Value fileTypeA = createValue(prefix + "_FileType_A", "FTA", fileTypeCat);
        Value fileTypeB = createValue(prefix + "_FileType_B", "FTB", fileTypeCat);
        fileTypeValueIds.put("FileType_A", fileTypeA.getId());
        fileTypeValueIds.put("FileType_B", fileTypeB.getId());

        // Vendor category
        Category vendorCat = new Category(prefix + "_Vendor");
        vendorCat.setName(prefix + "_Vendor");
        vendorCat.setCreatedBy("sync-e2e-test");
        vendorCat = categoryRepo.save(vendorCat);

        Value vendorA = createValue(prefix + "_Vendor_A", "VA", vendorCat);
        Value vendorB = createValue(prefix + "_Vendor_B", "VB", vendorCat);
        Value vendorRepl = createValue(prefix + "_Vendor_Repl", "VR", vendorCat);
        vendorValueIds.put("Vendor_A", vendorA.getId());
        vendorValueIds.put("Vendor_B", vendorB.getId());
        vendorValueIds.put("Vendor_Repl", vendorRepl.getId());

        // Equipment Type category
        Category eqTypeCat = new Category(prefix + "_EqType");
        eqTypeCat.setName(prefix + "_EqType");
        eqTypeCat.setCreatedBy("sync-e2e-test");
        eqTypeCat = categoryRepo.save(eqTypeCat);

        Value eqTypeVal = createValue(prefix + "_Valve", "VLV", eqTypeCat);

        // Location category
        Category locationCat = new Category(prefix + "_Location");
        locationCat.setName(prefix + "_Location");
        locationCat.setCreatedBy("sync-e2e-test");
        locationCat = categoryRepo.save(locationCat);

        Value locationVal = createValue(prefix + "_Unit1", "U1", locationCat);

        // Position category
        Category positionCat = new Category(prefix + "_Position");
        positionCat.setName(prefix + "_Position");
        positionCat.setCreatedBy("sync-e2e-test");
        positionCat = categoryRepo.save(positionCat);

        Value isoPos = createValue(prefix + "_Open", "OPN", positionCat);
        Value normPos = createValue(prefix + "_Closed", "CLS", positionCat);

        entityManager.flush();

        // Step 2: Create entities for each iteration
        List<LotoPoint> allLotoPoints = new ArrayList<>();

        for (int i = 0; i < iterations; i++) {
            // Create 2 FileObjects per iteration
            FileObject file0 = createFileObject(
                    prefix + "_File_" + i + "_0",
                    prefix + "_DOC_" + i + "_0",
                    fileTypeA, vendorA, filesOnDisk);

            FileObject file1 = createFileObject(
                    prefix + "_File_" + i + "_1",
                    prefix + "_DOC_" + i + "_1",
                    fileTypeB, vendorB, filesOnDisk);

            fileObjectIds.add(file0.getId());
            fileObjectIds.add(file1.getId());

            // Create 2 Equipment, each associated with 1 FileObject
            Equipment eq0 = new Equipment();
            eq0.setName(prefix + "_Equipment_" + i + "_0");
            eq0.setTagNumber(prefix + "_EQ_" + i + "_0");
            eq0.setDescription("Test Equipment " + i + "_0");
            eq0.setSpecificLocation("Location " + i);
            eq0.setCreatedBy("sync-e2e-test");
            eq0.setEqType(eqTypeVal);
            eq0.setLocation(locationVal);
            eq0.setFiles(new ArrayList<>(List.of(file0)));
            eq0 = equipmentRepo.save(eq0);
            equipmentIds.add(eq0.getId());

            Equipment eq1 = new Equipment();
            eq1.setName(prefix + "_Equipment_" + i + "_1");
            eq1.setTagNumber(prefix + "_EQ_" + i + "_1");
            eq1.setDescription("Test Equipment " + i + "_1");
            eq1.setSpecificLocation("Location " + i);
            eq1.setCreatedBy("sync-e2e-test");
            eq1.setEqType(eqTypeVal);
            eq1.setLocation(locationVal);
            eq1.setFiles(new ArrayList<>(List.of(file1)));
            eq1 = equipmentRepo.save(eq1);
            equipmentIds.add(eq1.getId());

            // Create 2 LotoPoints per Equipment (4 per iteration)
            for (int j = 0; j < 2; j++) {
                LotoPoint lp0 = new LotoPoint();
                lp0.setName(prefix + "_LP_" + i + "_0_" + j);
                lp0.setTagNumber(prefix + "_LP_" + i + "_0_" + j);
                lp0.setDescription("Test LotoPoint " + i + "_0_" + j);
                lp0.setCreatedBy("sync-e2e-test");
                lp0.setEqType(eqTypeVal);
                lp0.setLocation(locationVal);
                lp0.setIsoPos(isoPos);
                lp0.setNormPos(normPos);
                lp0 = lotoPointRepo.save(lp0);
                lotoPointIds.add(lp0.getId());
                allLotoPoints.add(lp0);

                LotoPoint lp1 = new LotoPoint();
                lp1.setName(prefix + "_LP_" + i + "_1_" + j);
                lp1.setTagNumber(prefix + "_LP_" + i + "_1_" + j);
                lp1.setDescription("Test LotoPoint " + i + "_1_" + j);
                lp1.setCreatedBy("sync-e2e-test");
                lp1.setEqType(eqTypeVal);
                lp1.setLocation(locationVal);
                lp1.setIsoPos(isoPos);
                lp1.setNormPos(normPos);
                lp1 = lotoPointRepo.save(lp1);
                lotoPointIds.add(lp1.getId());
                allLotoPoints.add(lp1);
            }

            entityManager.flush();
        }

        // Step 3: Create 1 LotoStandard using all LotoPoints
        LotoStandard ls = new LotoStandard();
        ls.setName(prefix + "_LotoStandard_0");
        ls.setDescription("Test LotoStandard with all points");
        ls.setCreatedBy("sync-e2e-test");

        Map<String, Integer> orderMap = new LinkedHashMap<>();
        int order = 1;
        for (LotoPoint lp : allLotoPoints) {
            ls.addLotoPoint(lp);
            orderMap.put(lp.getId().toString(), order++);
        }
        ls.setLotoPointOrder(orderMap);

        // Add group values
        ls.getGroups().add(eqTypeVal);

        ls = lotoStandardRepo.save(ls);
        lotoStandardIds.add(ls.getId());

        entityManager.flush();

        long duration = System.currentTimeMillis() - start;
        int totalEntities = fileObjectIds.size() + equipmentIds.size()
                + lotoPointIds.size() + lotoStandardIds.size()
                + 5 + 9; // 5 categories + 9 values

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("prefix", prefix);
        result.put("fileTypeCategoryId", fileTypeCat.getId());
        result.put("vendorCategoryId", vendorCat.getId());
        result.put("fileTypeValueIds", fileTypeValueIds);
        result.put("vendorValueIds", vendorValueIds);
        result.put("fileObjectIds", fileObjectIds);
        result.put("equipmentIds", equipmentIds);
        result.put("lotoPointIds", lotoPointIds);
        result.put("lotoStandardIds", lotoStandardIds);
        result.put("filesOnDisk", filesOnDisk);
        result.put("totalEntities", totalEntities);
        result.put("durationMs", duration);

        log.info("Seeded file entity graph '{}': {} iterations, {} total entities in {}ms",
                prefix, iterations, totalEntities, duration);
        return result;
    }

    // ==================== VERIFY FILE ENTITY GRAPH ====================

    @Transactional(readOnly = true)
    public Map<String, Object> verifyFileEntityGraph(String prefix) {
        Map<String, Object> result = new LinkedHashMap<>();
        String root = getProjectRoot();

        // Find FileObjects
        List<FileObject> fileObjects = fileRepo.findAll().stream()
                .filter(f -> f.getName() != null && f.getName().startsWith(prefix))
                .collect(Collectors.toList());

        result.put("fileObjects", fileObjects.stream().map(f -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", f.getId());
            m.put("name", f.getName());
            m.put("fileNumber", f.getFileNumber());
            m.put("vendorId", f.getVendor() != null ? f.getVendor().getId() : null);
            m.put("vendorName", f.getVendor() != null ? f.getVendor().getName() : null);
            m.put("fileTypeId", f.getFileType() != null ? f.getFileType().getId() : null);
            m.put("fileTypeName", f.getFileType() != null ? f.getFileType().getName() : null);
            m.put("fileLink", f.getStoredFileLink());
            m.put("folder", f.getFolder());
            m.put("extension", f.getExtension());
            m.put("extensions", f.getExtensions());

            // Check if file exists on disk
            String fileLink = f.getFileLink();
            boolean existsOnDisk = false;
            if (fileLink != null) {
                Path filePath = Paths.get(root, fileLink);
                existsOnDisk = Files.exists(filePath);
            }
            m.put("fileExistsOnDisk", existsOnDisk);

            // Get associated equipment IDs
            List<Long> eqIds = new ArrayList<>();
            if (f.getPoints() != null) {
                eqIds = f.getPoints().stream().map(Equipment::getId).collect(Collectors.toList());
            }
            m.put("equipmentIds", eqIds);

            return m;
        }).collect(Collectors.toList()));

        // Find Equipment
        List<Equipment> equipment = equipmentRepo.findAll().stream()
                .filter(e -> e.getName() != null && e.getName().startsWith(prefix))
                .collect(Collectors.toList());

        result.put("equipment", equipment.stream().map(e -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", e.getId());
            m.put("name", e.getName());
            m.put("fileIds", e.getFiles() != null
                    ? e.getFiles().stream().map(FileObject::getId).collect(Collectors.toList())
                    : List.of());
            m.put("lotoPointIds", e.getLotoPoints() != null
                    ? e.getLotoPoints().stream().map(LotoPoint::getId).collect(Collectors.toList())
                    : List.of());
            m.put("eqTypeId", e.getEqType() != null ? e.getEqType().getId() : null);
            m.put("locationId", e.getLocation() != null ? e.getLocation().getId() : null);
            return m;
        }).collect(Collectors.toList()));

        // Find LotoPoints
        List<LotoPoint> lotoPoints = lotoPointRepo.findAll().stream()
                .filter(lp -> lp.getName() != null && lp.getName().startsWith(prefix))
                .collect(Collectors.toList());

        result.put("lotoPoints", lotoPoints.stream().map(lp -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", lp.getId());
            m.put("name", lp.getName());
            m.put("eqTypeId", lp.getEqType() != null ? lp.getEqType().getId() : null);
            m.put("locationId", lp.getLocation() != null ? lp.getLocation().getId() : null);
            m.put("isoPosId", lp.getIsoPos() != null ? lp.getIsoPos().getId() : null);
            m.put("normPosId", lp.getNormPos() != null ? lp.getNormPos().getId() : null);
            return m;
        }).collect(Collectors.toList()));

        // Find LotoStandards
        List<LotoStandard> lotoStandards = lotoStandardRepo.findAll().stream()
                .filter(ls -> ls.getName() != null && ls.getName().startsWith(prefix))
                .collect(Collectors.toList());

        result.put("lotoStandards", lotoStandards.stream().map(ls -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", ls.getId());
            m.put("name", ls.getName());
            m.put("lotoPointIds", ls.getLotoPoints().stream()
                    .map(LotoPoint::getId).collect(Collectors.toList()));
            m.put("lotoPointOrder", ls.getLotoPointOrder());
            m.put("groupIds", ls.getGroups().stream()
                    .map(Value::getId).collect(Collectors.toList()));
            return m;
        }).collect(Collectors.toList()));

        result.put("counts", Map.of(
                "fileObjects", fileObjects.size(),
                "equipment", equipment.size(),
                "lotoPoints", lotoPoints.size(),
                "lotoStandards", lotoStandards.size()
        ));

        return result;
    }

    // ==================== HARD DELETE ====================

    /**
     * Hard-delete entities by prefix using native SQL, WITHOUT generating FieldChanges.
     * Uses SyncContext to suppress FieldChangeEntityListener.
     * Also deletes physical files from disk.
     */
    @Transactional
    public Map<String, Object> hardDeleteFileGraph(String prefix) {
        long start = System.currentTimeMillis();
        boolean wasSyncing = syncContext.isSyncing();
        if (!wasSyncing) {
            syncContext.startSync(); // suppress FieldChange tracking
        }

        try {
            String likePattern = prefix + "%";
            Map<String, Integer> deleteCounts = new LinkedHashMap<>();

            // Collect file paths before deleting
            List<String> filePaths = new ArrayList<>();
            @SuppressWarnings("unchecked")
            List<Object[]> fileRows = entityManager.createNativeQuery(
                    "SELECT file_link, extensions FROM file_object WHERE name LIKE ?1 AND deleted = false")
                    .setParameter(1, likePattern)
                    .getResultList();
            for (Object[] row : fileRows) {
                String fileLink = (String) row[0];
                String extensions = (String) row[1];
                if (fileLink != null) filePaths.add(fileLink);
                // Also collect paths for other extensions
                if (extensions != null && fileLink != null) {
                    for (String ext : extensions.split(",")) {
                        ext = ext.trim();
                        if (!ext.isEmpty() && !fileLink.contains("/" + ext + "/")) {
                            // Build alternate extension path
                            String altPath = fileLink.replaceFirst("/[^/]+/", "/" + ext + "/");
                            if (!altPath.equals(fileLink)) filePaths.add(altPath);
                        }
                    }
                }
            }

            // Delete in reverse dependency order via native SQL
            // 1. LotoStandard join tables
            deleteCounts.put("loto_standard_loto_point",
                    executeDelete("DELETE FROM loto_standard_loto_point WHERE loto_standard_id IN " +
                            "(SELECT id FROM loto_standard WHERE name LIKE ?1)", likePattern));
            deleteCounts.put("loto_standard_groups",
                    executeDelete("DELETE FROM loto_standard_groups WHERE loto_standard_id IN " +
                            "(SELECT id FROM loto_standard WHERE name LIKE ?1)", likePattern));

            // 2. LotoStandard
            deleteCounts.put("loto_standard",
                    executeDelete("DELETE FROM loto_standard WHERE name LIKE ?1", likePattern));

            // 3. Equipment join tables
            deleteCounts.put("eq_loto_point",
                    executeDelete("DELETE FROM eq_loto_point WHERE eq_id IN " +
                            "(SELECT id FROM equipment WHERE name LIKE ?1)", likePattern));
            deleteCounts.put("file_point",
                    executeDelete("DELETE FROM file_point WHERE point_id IN " +
                            "(SELECT id FROM equipment WHERE name LIKE ?1)", likePattern));

            // 4. LotoPoint
            deleteCounts.put("loto_point",
                    executeDelete("DELETE FROM loto_point WHERE name LIKE ?1", likePattern));

            // 5. Equipment
            deleteCounts.put("equipment",
                    executeDelete("DELETE FROM equipment WHERE name LIKE ?1", likePattern));

            // 6. FileObject
            deleteCounts.put("file_object",
                    executeDelete("DELETE FROM file_object WHERE name LIKE ?1", likePattern));

            // 7. Value
            deleteCounts.put("val_table",
                    executeDelete("DELETE FROM val_table WHERE name LIKE ?1", likePattern));

            // 8. Category
            deleteCounts.put("category",
                    executeDelete("DELETE FROM category WHERE name LIKE ?1", likePattern));

            entityManager.flush();

            // Delete physical files from disk
            int filesDeleted = 0;
            String root = getProjectRoot();
            for (String filePath : filePaths) {
                try {
                    Path p = Paths.get(root, filePath);
                    if (Files.deleteIfExists(p)) {
                        filesDeleted++;
                        // Clean up empty parent directories
                        cleanEmptyParents(p.getParent(), Paths.get(root, "uploads"));
                    }
                } catch (IOException e) {
                    log.warn("Failed to delete file {}: {}", filePath, e.getMessage());
                }
            }

            long duration = System.currentTimeMillis() - start;
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("success", true);
            result.put("prefix", prefix);
            result.put("deleteCounts", deleteCounts);
            result.put("filesDeletedFromDisk", filesDeleted);
            result.put("durationMs", duration);

            log.info("Hard-deleted file graph '{}': {} in {}ms, {} files removed from disk",
                    prefix, deleteCounts, duration, filesDeleted);
            return result;

        } finally {
            if (!wasSyncing) {
                syncContext.endSync();
            }
        }
    }

    // ==================== HELPERS ====================

    private Value createValue(String name, String alias, Category category) {
        Value value = new Value(name, alias);
        value.setCategory(category);
        value.setCreatedBy("sync-e2e-test");
        return valueRepo.save(value);
    }

    private FileObject createFileObject(String name, String fileNumber,
                                        Value fileType, Value vendor,
                                        List<String> filesOnDisk) {
        FileObject fo = new FileObject();
        fo.setName(name);
        fo.setFileNumber(fileNumber);
        fo.setExtension("pdf");
        fo.setExtensions("pdf");
        fo.setFileType(fileType);
        fo.setVendor(vendor);
        fo.setBaseLink("uploads");
        fo.setCreatedBy("sync-e2e-test");

        // Build and set file link and folder
        fo.buildFileLink();
        fo.buildFolder();

        fo = fileRepo.save(fo);

        // Write dummy file on disk
        String root = getProjectRoot();
        String fileLink = fo.getFileLink();
        if (fileLink != null) {
            try {
                Path filePath = Paths.get(root, fileLink);
                Files.createDirectories(filePath.getParent());
                Files.writeString(filePath, "SYNC_E2E_TEST_FILE_" + fileNumber);
                filesOnDisk.add(fileLink);
                log.debug("Created dummy file: {}", filePath);
            } catch (IOException e) {
                log.error("Failed to create dummy file for {}: {}", fileNumber, e.getMessage());
            }
        }

        return fo;
    }

    private int executeDelete(String sql, String likePattern) {
        return entityManager.createNativeQuery(sql)
                .setParameter(1, likePattern)
                .executeUpdate();
    }

    private String getProjectRoot() {
        if (projectRootPath != null && !projectRootPath.isEmpty()) {
            return projectRootPath;
        }
        return System.getProperty("user.dir");
    }

    private void cleanEmptyParents(Path dir, Path stopAt) {
        try {
            while (dir != null && !dir.equals(stopAt) && Files.isDirectory(dir)) {
                try (var entries = Files.list(dir)) {
                    if (entries.findFirst().isEmpty()) {
                        Files.delete(dir);
                        dir = dir.getParent();
                    } else {
                        break;
                    }
                }
            }
        } catch (IOException e) {
            // ignore cleanup failures
        }
    }
}
