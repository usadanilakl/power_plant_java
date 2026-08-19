package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.categories.Category;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.entities.loto.LotoStandard;
import com.dk_power.power_plant_java.entities.sync.PendingFileSync;
import com.dk_power.power_plant_java.repository.sync.PendingFileSyncRepository;
import com.dk_power.power_plant_java.sevice.hub.HubClientDirectiveService;
import org.springframework.beans.factory.ObjectProvider;
import com.dk_power.power_plant_java.repository.categories.CategoryRepo;
import com.dk_power.power_plant_java.repository.categories.ValueRepo;
import com.dk_power.power_plant_java.repository.equipment.EquipmentRepo;
import com.dk_power.power_plant_java.repository.loto.LotoPointRepo;
import com.dk_power.power_plant_java.repository.loto.LotoStandardRepo;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class SyncE2ETestService {

    private final CategoryRepo categoryRepo;
    private final ValueRepo valueRepo;
    private final EquipmentRepo equipmentRepo;
    private final LotoPointRepo lotoPointRepo;
    private final LotoStandardRepo lotoStandardRepo;
    private final PendingFileSyncRepository pendingFileSyncRepository;
    /** Hub-only bean — absent on a client, so resolve lazily via a provider (null off-hub). */
    private final ObjectProvider<HubClientDirectiveService> directiveProvider;

    @PersistenceContext
    private EntityManager entityManager;

    /** Test-only: set a next-boot directive for a client (bypasses the admin UI so the round-trip can be
     *  exercised in the lab). Hub-only. */
    public Map<String, Object> issueTestDirective(String machineId, String actionsCsv) {
        HubClientDirectiveService svc = directiveProvider.getIfAvailable();
        if (svc == null) return Map.of("success", false, "message", "not a hub");
        List<String> actions = Arrays.stream((actionsCsv == null ? "" : actionsCsv).split(","))
                .map(String::trim).filter(s -> !s.isEmpty()).collect(Collectors.toList());
        try {
            String id = svc.setDirective(machineId, actions, false, "e2e test directive");
            return Map.of("success", true, "directiveId", id, "machineId", machineId, "actions", actions);
        } catch (Exception e) {
            return Map.of("success", false, "message", e.getMessage());
        }
    }

    /** Test-only: enqueue a file UPLOAD (for exercising the pre-swap file re-queue). */
    @Transactional
    public Map<String, Object> enqueueFileUpload(Long entityId, String fileNumber, String extensions) {
        PendingFileSync p = pendingFileSyncRepository.save(
                new PendingFileSync(entityId, PendingFileSync.SyncDirection.UPLOAD, fileNumber, extensions));
        return Map.of("success", true, "id", p.getId(), "entityId", entityId);
    }

    /** Test-only: count active (PENDING/IN_PROGRESS) file UPLOADs. */
    public Map<String, Object> pendingUploadStats() {
        long pending = pendingFileSyncRepository.countByDirectionAndStatusIn(
                PendingFileSync.SyncDirection.UPLOAD,
                List.of(PendingFileSync.SyncStatus.PENDING, PendingFileSync.SyncStatus.IN_PROGRESS));
        return Map.of("pendingUploads", pending);
    }

    // ==================== SEED ENTITY GRAPH ====================

    @Transactional
    public Map<String, Object> seedEntityGraph(Map<String, Object> request) {
        long start = System.currentTimeMillis();
        String prefix = (String) request.getOrDefault("prefix", "SYNC_E2E_" + System.currentTimeMillis());

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> categoryDefs = (List<Map<String, Object>>) request.getOrDefault("categories", List.of());
        int equipmentCount = (int) request.getOrDefault("equipmentCount", 5);
        int lotoPointCount = (int) request.getOrDefault("lotoPointCount", 10);
        int lotoStandardCount = (int) request.getOrDefault("lotoStandardCount", 3);
        int lotoPointsPerStandard = (int) request.getOrDefault("lotoPointsPerStandard", 3);

        List<Long> categoryIds = new ArrayList<>();
        List<Long> valueIds = new ArrayList<>();
        List<Long> equipmentIds = new ArrayList<>();
        List<Long> lotoPointIds = new ArrayList<>();
        List<Long> lotoStandardIds = new ArrayList<>();
        List<Value> allValues = new ArrayList<>();

        // Step 1: Create Categories + Values
        for (Map<String, Object> catDef : categoryDefs) {
            String catName = prefix + "_" + catDef.get("name");
            Category category = new Category(catName);
            category.setName(catName);
            category.setCreatedBy("sync-e2e-test");
            category = categoryRepo.save(category);
            categoryIds.add(category.getId());

            @SuppressWarnings("unchecked")
            List<String> valueNames = (List<String>) catDef.getOrDefault("values", List.of());
            for (String valName : valueNames) {
                Value value = new Value(prefix + "_" + valName, valName.substring(0, Math.min(3, valName.length())).toUpperCase());
                value.setCategory(category);
                value.setCreatedBy("sync-e2e-test");
                value = valueRepo.save(value);
                valueIds.add(value.getId());
                allValues.add(value);
            }
        }

        entityManager.flush();

        // Step 2: Create Equipment with Value relationships
        // Group values by category order: 1st category → eqType, 2nd → location
        List<List<Value>> valuesByCategory = groupValuesByCategory(allValues, categoryDefs, prefix);
        List<Value> eqTypeValues = valuesByCategory.size() > 0 ? valuesByCategory.get(0) : List.of();
        List<Value> locationValues = valuesByCategory.size() > 1 ? valuesByCategory.get(1) : List.of();

        for (int i = 0; i < equipmentCount; i++) {
            Equipment eq = new Equipment();
            eq.setName(prefix + "_Equipment_" + i);
            eq.setTagNumber(prefix + "_EQ_" + i);
            eq.setDescription("Test Equipment " + i);
            eq.setSpecificLocation("Location " + i);
            eq.setCreatedBy("sync-e2e-test");
            if (!eqTypeValues.isEmpty()) {
                eq.setEqType(eqTypeValues.get(i % eqTypeValues.size()));
            }
            if (!locationValues.isEmpty()) {
                eq.setLocation(locationValues.get(i % locationValues.size()));
            }
            eq = equipmentRepo.save(eq);
            equipmentIds.add(eq.getId());
        }

        entityManager.flush();

        // Step 3: Create LotoPoints with Value relationships
        // 3rd category → position values (isoPos/normPos)
        List<Value> positionValues = valuesByCategory.size() > 2 ? valuesByCategory.get(2) : List.of();

        for (int i = 0; i < lotoPointCount; i++) {
            LotoPoint lp = new LotoPoint();
            lp.setName(prefix + "_LotoPoint_" + i);
            lp.setTagNumber(prefix + "_LP_" + i);
            lp.setDescription("Test LotoPoint " + i);
            lp.setSpecificLocation("Area " + (i % 5));
            lp.setUnit("U" + (i % 3 + 1));
            lp.setCreatedBy("sync-e2e-test");
            if (!eqTypeValues.isEmpty()) {
                lp.setEqType(eqTypeValues.get(i % eqTypeValues.size()));
            }
            if (!locationValues.isEmpty()) {
                lp.setLocation(locationValues.get(i % locationValues.size()));
            }
            if (positionValues.size() >= 2) {
                lp.setIsoPos(positionValues.get(0));
                lp.setNormPos(positionValues.get(1));
            } else if (positionValues.size() == 1) {
                lp.setIsoPos(positionValues.get(0));
            }
            lp = lotoPointRepo.save(lp);
            lotoPointIds.add(lp.getId());
        }

        entityManager.flush();

        // Step 4: Create LotoStandards with ManyToMany relationships
        List<LotoPoint> savedLotoPoints = lotoPointRepo.findAllById(lotoPointIds);
        int pointIndex = 0;

        for (int i = 0; i < lotoStandardCount; i++) {
            LotoStandard ls = new LotoStandard();
            ls.setName(prefix + "_LotoStandard_" + i);
            ls.setDescription("Test LotoStandard " + i);
            ls.setCreatedBy("sync-e2e-test");

            // Assign LotoPoints
            List<LotoPoint> assignedPoints = new ArrayList<>();
            for (int j = 0; j < lotoPointsPerStandard && pointIndex < savedLotoPoints.size(); j++) {
                LotoPoint point = savedLotoPoints.get(pointIndex++);
                ls.addLotoPoint(point);
                assignedPoints.add(point);
            }

            // Set lotoPointOrder
            Map<String, Integer> orderMap = new LinkedHashMap<>();
            int order = 1;
            for (LotoPoint point : assignedPoints) {
                orderMap.put(point.getId().toString(), order++);
            }
            ls.setLotoPointOrder(orderMap);

            // Assign group Values
            if (!allValues.isEmpty()) {
                int groupCount = Math.min(2, allValues.size());
                for (int g = 0; g < groupCount; g++) {
                    ls.getGroups().add(allValues.get((i + g) % allValues.size()));
                }
            }

            ls = lotoStandardRepo.save(ls);
            lotoStandardIds.add(ls.getId());
        }

        entityManager.flush();

        long duration = System.currentTimeMillis() - start;
        int totalEntities = categoryIds.size() + valueIds.size() + equipmentIds.size()
                + lotoPointIds.size() + lotoStandardIds.size();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("prefix", prefix);
        result.put("categoryIds", categoryIds);
        result.put("valueIds", valueIds);
        result.put("equipmentIds", equipmentIds);
        result.put("lotoPointIds", lotoPointIds);
        result.put("lotoStandardIds", lotoStandardIds);
        result.put("totalEntities", totalEntities);
        result.put("durationMs", duration);

        log.info("Seeded entity graph '{}': {} entities in {}ms", prefix, totalEntities, duration);
        return result;
    }

    // ==================== SEED DEDUP SCENARIO ====================

    @Transactional
    public Map<String, Object> seedDedupScenario(String prefix) {
        if (prefix == null) prefix = "SYNC_E2E_DEDUP_" + System.currentTimeMillis();
        long start = System.currentTimeMillis();

        // Create Category A: "Test EqType" with values ["Valve", "Motor"]
        Category catA = new Category(prefix + "_Test EqType");
        catA.setName(prefix + "_Test EqType");
        catA.setCreatedBy("sync-e2e-test");
        catA = categoryRepo.save(catA);

        Value valveA = new Value(prefix + "_Valve", "VLV");
        valveA.setCategory(catA);
        valveA.setCreatedBy("sync-e2e-test");
        valveA = valueRepo.save(valveA);

        Value motorA = new Value(prefix + "_Motor", "MTR");
        motorA.setCategory(catA);
        motorA.setCreatedBy("sync-e2e-test");
        motorA = valueRepo.save(motorA);

        // Create Category B: "test eqtype" (case-insensitive dup) with values ["Motor", "Pump"]
        Category catB = new Category(prefix + "_test eqtype");
        catB.setName(prefix + "_test eqtype");
        catB.setCreatedBy("sync-e2e-test");
        catB = categoryRepo.save(catB);

        Value motorB = new Value(prefix + "_motor", "MTR2");
        motorB.setCategory(catB);
        motorB.setCreatedBy("sync-e2e-test");
        motorB = valueRepo.save(motorB);

        Value pumpB = new Value(prefix + "_Pump", "PMP");
        pumpB.setCategory(catB);
        pumpB.setCreatedBy("sync-e2e-test");
        pumpB = valueRepo.save(pumpB);

        entityManager.flush();

        // Create LotoPoints referencing values from both categories
        LotoPoint lp1 = new LotoPoint();
        lp1.setName(prefix + "_LP_CatA");
        lp1.setTagNumber(prefix + "_LP_A");
        lp1.setDescription("LotoPoint referencing Category A value");
        lp1.setCreatedBy("sync-e2e-test");
        lp1.setEqType(valveA);
        lp1 = lotoPointRepo.save(lp1);

        LotoPoint lp2 = new LotoPoint();
        lp2.setName(prefix + "_LP_CatB");
        lp2.setTagNumber(prefix + "_LP_B");
        lp2.setDescription("LotoPoint referencing Category B value");
        lp2.setCreatedBy("sync-e2e-test");
        lp2.setEqType(pumpB);
        lp2 = lotoPointRepo.save(lp2);

        // Create Equipment referencing values from both categories
        Equipment eq1 = new Equipment();
        eq1.setName(prefix + "_EQ_CatA");
        eq1.setTagNumber(prefix + "_EQ_A");
        eq1.setDescription("Equipment referencing Category A value");
        eq1.setCreatedBy("sync-e2e-test");
        eq1.setEqType(motorA);
        eq1 = equipmentRepo.save(eq1);

        Equipment eq2 = new Equipment();
        eq2.setName(prefix + "_EQ_CatB");
        eq2.setTagNumber(prefix + "_EQ_B");
        eq2.setDescription("Equipment referencing Category B value");
        eq2.setCreatedBy("sync-e2e-test");
        eq2.setEqType(motorB);
        eq2 = equipmentRepo.save(eq2);

        entityManager.flush();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("prefix", prefix);
        result.put("categoryA", Map.of("id", catA.getId(), "name", catA.getName()));
        result.put("categoryB", Map.of("id", catB.getId(), "name", catB.getName()));
        result.put("valuesA", List.of(
                Map.of("id", valveA.getId(), "name", valveA.getName()),
                Map.of("id", motorA.getId(), "name", motorA.getName())
        ));
        result.put("valuesB", List.of(
                Map.of("id", motorB.getId(), "name", motorB.getName()),
                Map.of("id", pumpB.getId(), "name", pumpB.getName())
        ));
        result.put("lotoPointIds", List.of(lp1.getId(), lp2.getId()));
        result.put("equipmentIds", List.of(eq1.getId(), eq2.getId()));
        result.put("durationMs", System.currentTimeMillis() - start);

        log.info("Seeded dedup scenario '{}': 2 categories, 4 values, 2 lotoPoints, 2 equipment", prefix);
        return result;
    }

    // ==================== NATURAL-KEY DIVERGENCE (reconciler test) ====================

    /**
     * Create a Category + Value with a FIXED (non-prefixed) name plus a LotoPoint referencing the Value,
     * via normal saves (so they emit synced CREATEs). Run this with the SAME {@code name} on two nodes to
     * reproduce the cross-node natural-key divergence {@link NaturalKeyDivergenceReconciler} heals: with
     * deterministic-convergence OFF, whichever node's row reaches the hub first becomes the survivor, and the
     * later node's CREATE is redirected onto it (recorded in {@code dedup_id_remap}). The LotoPoint gives the
     * merge a reference to repoint. Test-only.
     */
    @Transactional
    public Map<String, Object> seedNamed(String name) {
        long start = System.currentTimeMillis();
        Category cat = new Category(name);
        cat.setName(name);
        cat.setCreatedBy("sync-e2e-test");
        cat = categoryRepo.save(cat);

        Value val = new Value(name + "_V", "DVG");
        val.setCategory(cat);
        val.setCreatedBy("sync-e2e-test");
        val = valueRepo.save(val);

        LotoPoint lp = new LotoPoint();
        lp.setName(name + "_LP");
        lp.setTagNumber(name + "_LP");
        lp.setDescription("divergence-test reference");
        lp.setCreatedBy("sync-e2e-test");
        lp.setEqType(val);
        lp = lotoPointRepo.save(lp);

        entityManager.flush();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("name", name);
        result.put("categoryId", cat.getId());
        result.put("valueId", val.getId());
        result.put("lotoPointId", lp.getId());
        result.put("durationMs", System.currentTimeMillis() - start);
        log.info("Seeded named category/value '{}': cat={} val={} lp={}", name, cat.getId(), val.getId(), lp.getId());
        return result;
    }

    /**
     * Read {@code dedup_id_remap} (native — bypasses the entity layer) so a test can confirm a
     * wrong-direction ({@code originalId < remappedId}) entry exists before reconcile and is gone after.
     */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> dedupRemaps(String type) {
        String sql = "SELECT entity_type, original_id, remapped_id FROM dedup_id_remap"
                + (type != null ? " WHERE entity_type = :type" : "")
                + " ORDER BY entity_type, original_id";
        var q = entityManager.createNativeQuery(sql);
        if (type != null) q.setParameter("type", type);
        List<Object[]> rows = q.getResultList();
        List<Map<String, Object>> out = new ArrayList<>();
        for (Object[] row : rows) {
            long original = ((Number) row[1]).longValue();
            long remapped = ((Number) row[2]).longValue();
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("entityType", row[0]);
            m.put("originalId", original);
            m.put("remappedId", remapped);
            m.put("wrongDirection", original < remapped);
            out.add(m);
        }
        return out;
    }

    // ==================== SEED BULK ====================

    @Transactional
    public Map<String, Object> seedBulk(String prefix, int count, int lotoPointsPerStandard) {
        if (prefix == null) prefix = "SYNC_E2E_BULK_" + System.currentTimeMillis();
        long start = System.currentTimeMillis();

        // Create shared base categories + values
        Category eqTypeCat = new Category(prefix + "_EqType");
        eqTypeCat.setName(prefix + "_EqType");
        eqTypeCat.setCreatedBy("sync-e2e-test");
        eqTypeCat = categoryRepo.save(eqTypeCat);

        Category locationCat = new Category(prefix + "_Location");
        locationCat.setName(prefix + "_Location");
        locationCat.setCreatedBy("sync-e2e-test");
        locationCat = categoryRepo.save(locationCat);

        Category positionCat = new Category(prefix + "_Position");
        positionCat.setName(prefix + "_Position");
        positionCat.setCreatedBy("sync-e2e-test");
        positionCat = categoryRepo.save(positionCat);

        List<Value> eqTypeValues = new ArrayList<>();
        for (String name : List.of("Valve", "Breaker", "Motor", "Pump", "Switch")) {
            Value v = new Value(prefix + "_" + name, name.substring(0, 3).toUpperCase());
            v.setCategory(eqTypeCat);
            v.setCreatedBy("sync-e2e-test");
            eqTypeValues.add(valueRepo.save(v));
        }

        List<Value> locationValues = new ArrayList<>();
        for (String name : List.of("Area A", "Area B", "Area C", "Area D", "Area E")) {
            Value v = new Value(prefix + "_" + name, name.substring(0, 3).toUpperCase());
            v.setCategory(locationCat);
            v.setCreatedBy("sync-e2e-test");
            locationValues.add(valueRepo.save(v));
        }

        List<Value> positionValues = new ArrayList<>();
        for (String name : List.of("Open", "Closed", "Locked", "Energized", "De-energized")) {
            Value v = new Value(prefix + "_" + name, name.substring(0, 3).toUpperCase());
            v.setCategory(positionCat);
            v.setCreatedBy("sync-e2e-test");
            positionValues.add(valueRepo.save(v));
        }

        entityManager.flush();

        // Create LotoPoints
        int totalPoints = count * lotoPointsPerStandard;
        List<LotoPoint> lotoPoints = new ArrayList<>(totalPoints);
        for (int i = 0; i < totalPoints; i++) {
            LotoPoint lp = new LotoPoint();
            lp.setName(prefix + "_LP_" + i);
            lp.setTagNumber(prefix + "_LP_" + i);
            lp.setDescription("Bulk LotoPoint " + i);
            lp.setCreatedBy("sync-e2e-test");
            lp.setEqType(eqTypeValues.get(i % eqTypeValues.size()));
            lp.setLocation(locationValues.get(i % locationValues.size()));
            lp.setIsoPos(positionValues.get(i % positionValues.size()));
            lp.setNormPos(positionValues.get((i + 1) % positionValues.size()));
            lotoPoints.add(lotoPointRepo.save(lp));

            if (i % 100 == 99) {
                entityManager.flush();
                entityManager.clear();
                // Re-attach value references after clear — must reassign lists with managed instances
                eqTypeValues = eqTypeValues.stream().map(entityManager::merge).collect(Collectors.toList());
                locationValues = locationValues.stream().map(entityManager::merge).collect(Collectors.toList());
                positionValues = positionValues.stream().map(entityManager::merge).collect(Collectors.toList());
            }
        }
        entityManager.flush();

        // Reload all loto points for ManyToMany assignment
        List<Long> lpIds = lotoPoints.stream().map(LotoPoint::getId).collect(Collectors.toList());

        // Re-merge value references after LotoPoint batch processing may have cleared the session
        eqTypeValues = eqTypeValues.stream().map(entityManager::merge).collect(Collectors.toList());

        // Store Value IDs for re-merge after clear during LotoStandard batching
        List<Long> eqTypeValueIds = eqTypeValues.stream().map(Value::getId).collect(Collectors.toList());

        // Create LotoStandards
        int standardsCreated = 0;
        int pointIndex = 0;
        for (int i = 0; i < count; i++) {
            LotoStandard ls = new LotoStandard();
            ls.setName(prefix + "_LS_" + i);
            ls.setDescription("Bulk LotoStandard " + i);
            ls.setCreatedBy("sync-e2e-test");

            // Assign LotoPoints by ID range
            List<LotoPoint> assignedPoints = new ArrayList<>();
            for (int j = 0; j < lotoPointsPerStandard && pointIndex < lpIds.size(); j++) {
                LotoPoint lp = entityManager.find(LotoPoint.class, lpIds.get(pointIndex++));
                if (lp != null) {
                    ls.addLotoPoint(lp);
                    assignedPoints.add(lp);
                }
            }

            // Set order
            Map<String, Integer> orderMap = new LinkedHashMap<>();
            int order = 1;
            for (LotoPoint p : assignedPoints) {
                orderMap.put(p.getId().toString(), order++);
            }
            ls.setLotoPointOrder(orderMap);

            // Add group — use managed Value reference
            Value groupValue = entityManager.find(Value.class, eqTypeValueIds.get(i % eqTypeValueIds.size()));
            if (groupValue != null) {
                ls.getGroups().add(groupValue);
            }

            lotoStandardRepo.save(ls);
            standardsCreated++;

            if (i % 100 == 99) {
                entityManager.flush();
            }
        }
        entityManager.flush();

        long duration = System.currentTimeMillis() - start;
        int totalEntities = 3 + 15 + totalPoints + standardsCreated; // cats + vals + points + standards

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("prefix", prefix);
        result.put("lotoStandardsCreated", standardsCreated);
        result.put("lotoPointsCreated", totalPoints);
        result.put("totalEntities", totalEntities);
        result.put("durationMs", duration);
        result.put("entitiesPerSecond", totalEntities * 1000.0 / Math.max(duration, 1));

        log.info("Seeded bulk '{}': {} standards, {} points in {}ms ({} entities/sec)",
                prefix, standardsCreated, totalPoints, duration,
                String.format("%.0f", totalEntities * 1000.0 / Math.max(duration, 1)));
        return result;
    }

    // ==================== VERIFY ====================

    @Transactional(readOnly = true)
    public Map<String, Object> verifyEntityGraph(String prefix) {
        Map<String, Object> result = new LinkedHashMap<>();

        // Find categories
        List<Category> categories = categoryRepo.findAll().stream()
                .filter(c -> c.getName() != null && c.getName().startsWith(prefix))
                .collect(Collectors.toList());

        // Find values
        List<Value> values = valueRepo.findAll().stream()
                .filter(v -> v.getName() != null && v.getName().startsWith(prefix))
                .collect(Collectors.toList());

        // Find equipment
        List<Equipment> equipment = equipmentRepo.findAll().stream()
                .filter(e -> e.getName() != null && e.getName().startsWith(prefix))
                .collect(Collectors.toList());

        // Find loto points
        List<LotoPoint> lotoPoints = lotoPointRepo.findAll().stream()
                .filter(lp -> lp.getName() != null && lp.getName().startsWith(prefix))
                .collect(Collectors.toList());

        // Find loto standards
        List<LotoStandard> lotoStandards = lotoStandardRepo.findAll().stream()
                .filter(ls -> ls.getName() != null && ls.getName().startsWith(prefix))
                .collect(Collectors.toList());

        result.put("prefix", prefix);
        result.put("categories", categories.stream().map(c -> Map.of(
                "id", c.getId(),
                "name", c.getName(),
                "deleted", c.getDeleted() != null && c.getDeleted(),
                "valueCount", values.stream().filter(v -> v.getCategory() != null
                        && v.getCategory().getId().equals(c.getId())).count()
        )).collect(Collectors.toList()));

        result.put("values", values.stream().map(v -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", v.getId());
            m.put("name", v.getName());
            m.put("categoryId", v.getCategory() != null ? v.getCategory().getId() : null);
            m.put("categoryName", v.getCategory() != null ? v.getCategory().getName() : null);
            return m;
        }).collect(Collectors.toList()));

        result.put("equipment", equipment.stream().map(e -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", e.getId());
            m.put("name", e.getName());
            m.put("tagNumber", e.getTagNumber());
            m.put("eqTypeId", e.getEqType() != null ? e.getEqType().getId() : null);
            m.put("locationId", e.getLocation() != null ? e.getLocation().getId() : null);
            return m;
        }).collect(Collectors.toList()));

        result.put("lotoPoints", lotoPoints.stream().map(lp -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", lp.getId());
            m.put("name", lp.getName());
            m.put("tagNumber", lp.getTagNumber());
            m.put("isoPosId", lp.getIsoPos() != null ? lp.getIsoPos().getId() : null);
            m.put("normPosId", lp.getNormPos() != null ? lp.getNormPos().getId() : null);
            m.put("eqTypeId", lp.getEqType() != null ? lp.getEqType().getId() : null);
            m.put("locationId", lp.getLocation() != null ? lp.getLocation().getId() : null);
            return m;
        }).collect(Collectors.toList()));

        result.put("lotoStandards", lotoStandards.stream().map(ls -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", ls.getId());
            m.put("name", ls.getName());
            m.put("description", ls.getDescription());
            m.put("lotoPointIds", ls.getLotoPoints().stream()
                    .map(lp -> lp.getId()).collect(Collectors.toList()));
            m.put("lotoPointOrder", ls.getLotoPointOrder());
            m.put("groupIds", ls.getGroups().stream()
                    .map(v -> v.getId()).collect(Collectors.toList()));
            return m;
        }).collect(Collectors.toList()));

        result.put("counts", Map.of(
                "categories", categories.size(),
                "values", values.size(),
                "equipment", equipment.size(),
                "lotoPoints", lotoPoints.size(),
                "lotoStandards", lotoStandards.size()
        ));

        return result;
    }

    // ==================== CLEANUP ====================

    @Transactional
    public Map<String, Object> cleanup(String prefix) {
        long start = System.currentTimeMillis();
        int deleted = 0;

        // Delete in reverse dependency order: LotoStandard → LotoPoint → Equipment → Value → Category
        List<LotoStandard> standards = lotoStandardRepo.findAll().stream()
                .filter(ls -> ls.getName() != null && ls.getName().startsWith(prefix))
                .collect(Collectors.toList());
        for (LotoStandard ls : standards) {
            ls.getLotoPoints().clear();
            ls.getGroups().clear();
            ls.setDeleted(true);
            lotoStandardRepo.save(ls);
            deleted++;
        }

        List<LotoPoint> lotoPoints = lotoPointRepo.findAll().stream()
                .filter(lp -> lp.getName() != null && lp.getName().startsWith(prefix))
                .collect(Collectors.toList());
        for (LotoPoint lp : lotoPoints) {
            lp.setDeleted(true);
            lotoPointRepo.save(lp);
            deleted++;
        }

        List<Equipment> equipment = equipmentRepo.findAll().stream()
                .filter(e -> e.getName() != null && e.getName().startsWith(prefix))
                .collect(Collectors.toList());
        for (Equipment e : equipment) {
            if (e.getLotoPoints() != null) e.getLotoPoints().clear();
            e.setDeleted(true);
            equipmentRepo.save(e);
            deleted++;
        }

        List<Value> values = valueRepo.findAll().stream()
                .filter(v -> v.getName() != null && v.getName().startsWith(prefix))
                .collect(Collectors.toList());
        for (Value v : values) {
            v.setDeleted(true);
            valueRepo.save(v);
            deleted++;
        }

        List<Category> categories = categoryRepo.findAll().stream()
                .filter(c -> c.getName() != null && c.getName().startsWith(prefix))
                .collect(Collectors.toList());
        for (Category c : categories) {
            c.setDeleted(true);
            categoryRepo.save(c);
            deleted++;
        }

        entityManager.flush();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("prefix", prefix);
        result.put("deletedCount", deleted);
        result.put("durationMs", System.currentTimeMillis() - start);

        log.info("Cleanup '{}': {} entities soft-deleted in {}ms", prefix, deleted, result.get("durationMs"));
        return result;
    }

    @Transactional
    public Map<String, Object> cleanupAll() {
        return cleanup("SYNC_E2E_");
    }

    // ==================== HELPERS ====================

    /**
     * Groups values by their category, in the same order as the category definitions from the request.
     */
    private List<List<Value>> groupValuesByCategory(List<Value> allValues, List<Map<String, Object>> categoryDefs, String prefix) {
        List<List<Value>> result = new ArrayList<>();
        for (Map<String, Object> catDef : categoryDefs) {
            String catName = prefix + "_" + catDef.get("name");
            List<Value> catValues = allValues.stream()
                    .filter(v -> v.getCategory() != null && catName.equals(v.getCategory().getName()))
                    .collect(Collectors.toList());
            result.add(catValues);
        }
        return result;
    }
}
