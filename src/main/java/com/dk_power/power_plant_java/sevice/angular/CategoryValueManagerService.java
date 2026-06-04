package com.dk_power.power_plant_java.sevice.angular;

import com.dk_power.power_plant_java.dto.categories.*;
import com.dk_power.power_plant_java.entities.categories.Category;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.repository.categories.CategoryRepo;
import com.dk_power.power_plant_java.repository.categories.ValueRepo;
import com.dk_power.power_plant_java.sevice.ServiceFacade;
import com.dk_power.power_plant_java.sevice.angular.file.NgFileService;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoPointService;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import com.dk_power.power_plant_java.sevice.sync.EntityTableRegistry;
import com.dk_power.power_plant_java.sevice.sync.ValueReferenceRepointService;
import com.dk_power.power_plant_java.util.Util;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import jakarta.annotation.PostConstruct;

import java.lang.reflect.Field;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional
public class CategoryValueManagerService {

    private final CategoryRepo categoryRepo;
    private final ValueRepo valueRepo;
    private final NgValueService ngValueService;
    private final NgEquipmentService equipmentService;
    private final NgFileService fileService;
    private final NgLotoPointService lotoPointService;
    private final ServiceFacade serviceFacade;
    private final EntityTableRegistry entityTableRegistry;
    private final ValueReferenceRepointService valueReferenceRepointService;
    private final PlatformTransactionManager transactionManager;

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * Used to wrap each orphan pair's mutation work in its own REQUIRES_NEW
     * transaction so a failure (count probe blowing up, synthetic FieldChange
     * emission returning empty, etc.) rolls back that pair's repoint + synthetic
     * FieldChange rows atomically — without taking down other successfully
     * processed pairs in the same batch. The dedup endpoint can then return
     * the per-op statuses it accumulated.
     */
    private TransactionTemplate perPairTxTemplate;

    @PostConstruct
    void initPerPairTxTemplate() {
        this.perPairTxTemplate = new TransactionTemplate(transactionManager);
        this.perPairTxTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    // ==================== CATEGORY OPERATIONS ====================

    /**
     * Get all categories with their value counts.
     */
    public List<CategoryWithCountDto> getAllCategoriesWithCounts() {
        return categoryRepo.findAll().stream()
            .map(cat -> new CategoryWithCountDto(
                cat.getId(),
                cat.getName(),
                cat.getAlias(),
                cat.getValues() != null ? cat.getValues().size() : 0
            ))
            // nullsFirst because data may contain Categories with name=null
            // (legacy/orphaned rows) — the bare CASE_INSENSITIVE_ORDER throws
            // a HelpfulNullPointerException on a null left-hand side.
            .sorted(Comparator.comparing(CategoryWithCountDto::getName,
                    Comparator.nullsFirst(String.CASE_INSENSITIVE_ORDER)))
            .collect(Collectors.toList());
    }

    /**
     * Create a new category. Delegates to NgValueService.createCategory() which
     * already checks for duplicates.
     */
    public CategoryDto createCategory(String name, String alias) {
        if (alias == null || alias.isBlank()) {
            alias = Util.toCamelCase(name);
        }

        // Check if category already exists
        List<Category> existingByAlias = categoryRepo.findByAlias(alias);
        if (!existingByAlias.isEmpty()) {
            throw new RuntimeException("Category with alias '" + alias + "' already exists");
        }

        List<Category> existingByName = categoryRepo.findByNameIgnoreCase(name);
        if (!existingByName.isEmpty()) {
            throw new RuntimeException("Category with name '" + name + "' already exists");
        }

        Category category = new Category(name);
        category.setAlias(alias);
        Category saved = categoryRepo.save(category);
        return ngValueService.categoryToDto(saved);
    }

    /**
     * Update category name and/or alias.
     */
    public CategoryDto updateCategory(Long id, String newName, String newAlias) {
        Category category = categoryRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));

        // Check for conflicts with other categories
        if (newName != null && !newName.equals(category.getName())) {
            List<Category> conflicts = categoryRepo.findByNameIgnoreCase(newName);
            conflicts.removeIf(c -> c.getId().equals(id));
            if (!conflicts.isEmpty()) {
                throw new RuntimeException("Another category with name '" + newName + "' already exists");
            }
            category.setName(newName);
        }

        if (newAlias != null && !newAlias.equals(category.getAlias())) {
            List<Category> conflictByAlias = categoryRepo.findByAlias(newAlias);
            conflictByAlias.removeIf(c -> c.getId().equals(id));
            if (!conflictByAlias.isEmpty()) {
                throw new RuntimeException("Another category with alias '" + newAlias + "' already exists");
            }
            category.setAlias(newAlias);
        }

        Category saved = categoryRepo.save(category);
        return ngValueService.categoryToDto(saved);
    }

    /**
     * Check if a category can be deleted (has no values).
     */
    public Map<String, Object> canDeleteCategory(Long categoryId) {
        Category category = categoryRepo.findById(categoryId)
            .orElseThrow(() -> new RuntimeException("Category not found with id: " + categoryId));

        int valueCount = category.getValues() != null ? category.getValues().size() : 0;
        return Map.of(
            "canDelete", valueCount == 0,
            "valueCount", valueCount,
            "requiresTransfer", valueCount > 0
        );
    }

    /**
     * Delete a category. If it has values, they must be transferred first.
     */
    public void deleteCategory(Long categoryId, Long transferToCategoryId) {
        Category category = categoryRepo.findById(categoryId)
            .orElseThrow(() -> new RuntimeException("Category not found with id: " + categoryId));

        int valueCount = category.getValues() != null ? category.getValues().size() : 0;

        if (valueCount > 0) {
            if (transferToCategoryId == null) {
                throw new RuntimeException("Category has " + valueCount + " values - must specify transfer target");
            }
            if (transferToCategoryId.equals(categoryId)) {
                throw new RuntimeException("Cannot transfer values to the same category");
            }
            transferAllValues(categoryId, transferToCategoryId);
        }

        category.setDeleted(true);
        categoryRepo.save(category);
        log.info("Deleted category: {} (ID={})", category.getName(), categoryId);
    }

    /**
     * Find duplicate categories (same name, case-insensitive).
     */
    @SuppressWarnings("unchecked")
    public List<DuplicateCategoryDto> findDuplicateCategories() {
        List<Object[]> duplicates = entityManager.createNativeQuery(
            "SELECT LOWER(name) as lname, COUNT(*) as cnt FROM category " +
            "WHERE deleted = false GROUP BY LOWER(name) HAVING COUNT(*) > 1")
            .getResultList();

        List<DuplicateCategoryDto> result = new ArrayList<>();
        for (Object[] row : duplicates) {
            String name = (String) row[0];
            List<Category> cats = categoryRepo.findByNameIgnoreCase(name);
            List<CategoryDto> catDtos = cats.stream()
                .map(ngValueService::categoryToDto)
                .collect(Collectors.toList());
            result.add(new DuplicateCategoryDto(name, catDtos));
        }
        return result;
    }

    /**
     * Merge duplicate categories into one. The keepId category is preserved,
     * all values from duplicate categories are transferred to it, and duplicates
     * are soft-deleted.
     */
    public CategoryDto mergeCategories(Long keepId, List<Long> duplicateIds) {
        Category keepCategory = categoryRepo.findById(keepId)
            .orElseThrow(() -> new RuntimeException("Keep category not found with id: " + keepId));

        for (Long dupId : duplicateIds) {
            if (dupId.equals(keepId)) continue;

            Category duplicate = categoryRepo.findById(dupId).orElse(null);
            if (duplicate == null || duplicate.getDeleted()) continue;

            // Transfer all values from duplicate to keepCategory
            if (duplicate.getValues() != null) {
                for (Value value : new ArrayList<>(duplicate.getValues())) {
                    value.setCategory(keepCategory);
                    valueRepo.save(value);
                }
            }

            // Soft-delete the duplicate
            duplicate.setDeleted(true);
            categoryRepo.save(duplicate);
            log.info("Merged category '{}' (ID={}) into '{}' (ID={})",
                duplicate.getName(), dupId, keepCategory.getName(), keepId);
        }

        return ngValueService.categoryToDto(keepCategory);
    }

    // ==================== VALUE OPERATIONS ====================

    /**
     * Get all values, optionally filtered by category.
     */
    public List<ValueDto> getAllValues(Long categoryId) {
        List<Value> values;
        if (categoryId != null) {
            Category category = categoryRepo.findById(categoryId).orElse(null);
            if (category == null) {
                return List.of();
            }
            values = new ArrayList<>(category.getValues());
        } else {
            values = valueRepo.findAll();
        }

        return values.stream()
            .map(ngValueService::valueToDto)
            // nullsFirst — see getAllCategoriesWithCounts; some Value rows
            // legitimately have name=null in your data and they'd otherwise
            // crash the sort with a HelpfulNullPointerException.
            .sorted(Comparator.comparing(ValueDto::getName,
                    Comparator.nullsFirst(String.CASE_INSENSITIVE_ORDER)))
            .collect(Collectors.toList());
    }

    /**
     * Create a new value in a category.
     */
    public ValueDto createValue(Long categoryId, String name, String alias) {
        Category category = categoryRepo.findById(categoryId)
            .orElseThrow(() -> new RuntimeException("Category not found with id: " + categoryId));

        // Check for duplicate within category
        Value existing = category.getValueByName(name);
        if (existing != null) {
            throw new RuntimeException("Value '" + name + "' already exists in category '" + category.getName() + "'");
        }

        Value value = new Value(name, alias);
        value.setCategory(category);
        Value saved = valueRepo.save(value);
        return ngValueService.valueToDto(saved);
    }

    /**
     * Update a value's name and/or alias.
     * Delegates to NgValueService.updateValueName() which handles file relocation
     * for Vendor/FileType categories.
     */
    public ValueDto updateValue(Long id, String newName, String newAlias) {
        Value updated;
        if (newAlias != null && !newAlias.isBlank()) {
            updated = ngValueService.updateValueName(id, newName, newAlias);
        } else {
            updated = ngValueService.updateValueName(id, newName);
        }
        return ngValueService.valueToDto(updated);
    }

    /**
     * Get value dependencies (count of Equipment, Files, LotoPoints referencing it).
     */
    public ValueWithDependenciesDto getValueDependencies(Long valueId) {
        Value value = valueRepo.findById(valueId)
            .orElseThrow(() -> new RuntimeException("Value not found with id: " + valueId));

        List<Equipment> equipment = equipmentService.findByValue(value);
        List<FileObject> files = fileService.findByValue(value);
        List<LotoPoint> lotoPoints = lotoPointService.findByValue(value);

        List<String> equipmentSamples = equipment.stream()
            .map(Equipment::getTagNumber)
            .filter(Objects::nonNull)
            .limit(5)
            .collect(Collectors.toList());

        List<String> fileSamples = files.stream()
            .map(FileObject::getName)
            .filter(Objects::nonNull)
            .limit(5)
            .collect(Collectors.toList());

        return new ValueWithDependenciesDto(
            ngValueService.valueToDto(value),
            equipment.size(),
            files.size(),
            lotoPoints.size(),
            equipmentSamples,
            fileSamples
        );
    }

    /**
     * Delete a value. If it has references, they must be transferred first.
     * Delegates to NgValueService methods which handle downstream entity transfer.
     */
    public void deleteValue(Long valueId, Long transferToValueId) {
        Value value = valueRepo.findById(valueId)
            .orElseThrow(() -> new RuntimeException("Value not found with id: " + valueId));

        // If transfer target specified, move all items first
        if (transferToValueId != null) {
            if (transferToValueId.equals(valueId)) {
                throw new RuntimeException("Cannot transfer references to the same value");
            }
            ngValueService.moveItemsToNewValue(valueId, transferToValueId);
        }

        // Now delete the value
        ngValueService.deleteValue(valueId);
        log.info("Deleted value: {} (ID={})", value.getName(), valueId);
    }

    /**
     * Find duplicate values (same name within same category, case-insensitive).
     */
    @SuppressWarnings("unchecked")
    public List<DuplicateValueDto> findDuplicateValues(Long categoryId) {
        String sql = "SELECT LOWER(name) as lname, category_id, COUNT(*) as cnt FROM val_table " +
            "WHERE deleted = false AND category_id IS NOT NULL ";

        if (categoryId != null) {
            sql += "AND category_id = " + categoryId + " ";
        }

        sql += "GROUP BY LOWER(name), category_id HAVING COUNT(*) > 1";

        List<Object[]> duplicates = entityManager.createNativeQuery(sql).getResultList();

        List<DuplicateValueDto> result = new ArrayList<>();
        for (Object[] row : duplicates) {
            String name = (String) row[0];
            Long catId = ((Number) row[1]).longValue();
            Category category = categoryRepo.findById(catId).orElse(null);

            List<Value> values = valueRepo.findByNameIgnoreCaseAndCategoryId(name, catId);
            List<ValueDto> valueDtos = values.stream()
                .map(ngValueService::valueToDto)
                .collect(Collectors.toList());

            result.add(new DuplicateValueDto(
                name,
                category != null ? category.getName() : "Unknown",
                catId,
                valueDtos
            ));
        }
        return result;
    }

    /**
     * Merge duplicate values into one. The keepId value is preserved,
     * all references from duplicate values are transferred to it, and duplicates
     * are soft-deleted.
     */
    public ValueDto mergeValues(Long keepId, List<Long> duplicateIds) {
        Value keepValue = valueRepo.findById(keepId)
            .orElseThrow(() -> new RuntimeException("Keep value not found with id: " + keepId));

        for (Long dupId : duplicateIds) {
            if (dupId.equals(keepId)) continue;

            Value duplicate = valueRepo.findById(dupId).orElse(null);
            if (duplicate == null || duplicate.getDeleted()) continue;

            // Transfer all references using existing refactorValues pattern
            refactorAllReferences(duplicate, keepValue);

            // Soft-delete the duplicate
            duplicate.setDeleted(true);
            valueRepo.save(duplicate);
            log.info("Merged value '{}' (ID={}) into '{}' (ID={})",
                duplicate.getName(), dupId, keepValue.getName(), keepId);
        }

        return ngValueService.valueToDto(keepValue);
    }

    /**
     * Move a value to a different category.
     */
    public ValueDto moveValueToCategory(Long valueId, Long targetCategoryId) {
        Value moved = ngValueService.moveValueToCategory(valueId, targetCategoryId);
        return ngValueService.valueToDto(moved);
    }

    // ==================== HELPER METHODS ====================

    /**
     * Transfer all values from one category to another.
     */
    private void transferAllValues(Long fromCategoryId, Long toCategoryId) {
        Category from = categoryRepo.findById(fromCategoryId)
            .orElseThrow(() -> new RuntimeException("Source category not found"));
        Category to = categoryRepo.findById(toCategoryId)
            .orElseThrow(() -> new RuntimeException("Target category not found"));

        if (from.getValues() != null) {
            for (Value value : new ArrayList<>(from.getValues())) {
                value.setCategory(to);
                valueRepo.save(value);
            }
            log.info("Transferred {} values from category '{}' to '{}'",
                from.getValues().size(), from.getName(), to.getName());
        }
    }

    /**
     * Re-point all references from duplicate Value to canonical Value
     * across all registered entity types. Uses the same pattern as
     * CategoryValueMergeService.
     */
    private void refactorAllReferences(Value duplicate, Value canonical) {
        for (String entityType : entityTableRegistry.getSyncOrder()) {
            if ("Category".equals(entityType) || "Value".equals(entityType)) continue;

            try {
                SyncableService<?> service = serviceFacade.getService(entityType);
                if (service == null) continue;

                List<?> affected = service.refactorValues(duplicate, canonical);
                if (!affected.isEmpty()) {
                    log.debug("Re-pointed {} {} entities from Value #{} to #{}",
                        affected.size(), entityType, duplicate.getId(), canonical.getId());
                }
            } catch (Exception e) {
                log.warn("Error re-pointing {} references: {}", entityType, e.getMessage());
            }
        }
    }

    // ==================== ORPHAN DEDUP ====================

    /**
     * Find Values whose {@code name} matches a canonical Value in the target
     * Category but whose own {@code category} is null or different — i.e. they
     * are the "orphan" rows that entity FKs still point at, invisible to the
     * Category-based dropdown loader.
     *
     * <p>For every orphan we also count how many entities currently reference
     * it (across all registered SyncableServices) so the operator can judge
     * impact before approving a merge.
     */
    public List<OrphanValueDto> findOrphanValues(String categoryAlias) {
        if (categoryAlias == null || categoryAlias.isBlank()) {
            throw new IllegalArgumentException("categoryAlias is required");
        }

        Category targetCategory = categoryRepo.findByAlias(categoryAlias).stream()
                .findFirst()
                .orElseGet(() -> categoryRepo.findByNameIgnoreCase(categoryAlias).stream().findFirst().orElse(null));
        if (targetCategory == null) {
            throw new IllegalArgumentException("Category not found: " + categoryAlias);
        }
        Long targetCatId = targetCategory.getId();

        // Build a single lookup keyed by lower/trim of BOTH `name` and `alias`
        // for every canonical Value in the target Category. We need to match by
        // either key so orphans with a null name but a meaningful alias (e.g.
        // "PID") still resolve to the canonical — they're a real data shape in
        // your DB and a name-only matcher misses them entirely.
        Map<String, Value> canonicalByKey = new HashMap<>();
        if (targetCategory.getValues() != null) {
            for (Value v : targetCategory.getValues()) {
                if (Boolean.TRUE.equals(v.getDeleted())) continue;
                if (v.getName() != null && !v.getName().isBlank()) {
                    canonicalByKey.putIfAbsent(v.getName().toLowerCase().trim(), v);
                }
                if (v.getAlias() != null && !v.getAlias().isBlank()) {
                    canonicalByKey.putIfAbsent(v.getAlias().toLowerCase().trim(), v);
                }
            }
        }
        if (canonicalByKey.isEmpty()) {
            log.info("findOrphanValues({}): target category has no values — nothing to canonicalize against", categoryAlias);
            return Collections.emptyList();
        }

        // Scan every active Value for a name-OR-alias match outside the target category.
        // Track which canonical each orphan picks (the orphan's own name takes
        // priority over its alias when both match different canonicals).
        Map<Long, Value> orphanIdToCanonical = new HashMap<>();
        for (Value v : valueRepo.findAll()) {
            if (Boolean.TRUE.equals(v.getDeleted())) continue;
            Value canonical = null;
            if (v.getName() != null && !v.getName().isBlank()) {
                canonical = canonicalByKey.get(v.getName().toLowerCase().trim());
            }
            if (canonical == null && v.getAlias() != null && !v.getAlias().isBlank()) {
                canonical = canonicalByKey.get(v.getAlias().toLowerCase().trim());
            }
            if (canonical == null) continue;
            if (Objects.equals(v.getId(), canonical.getId())) continue; // skip the canonical itself
            // "Orphan" = no category OR a category other than the target.
            boolean isOrphan = v.getCategory() == null
                    || !Objects.equals(v.getCategory().getId(), targetCatId);
            if (isOrphan) orphanIdToCanonical.put(v.getId(), canonical);
        }

        // Count references via native SQL — the reflection-based scan triggers
        // findAll() on every SyncableService and any single failure marks the
        // current transaction as rollback-only (even when we swallow the
        // exception), which kills dedup at commit time. Native SQL queries the
        // FK columns directly (including ManyToMany join tables), bypasses
        // @Where and lazy-load surprises, and tells the actual truth.
        ValueReferenceRepointService.Metadata refMeta = valueReferenceRepointService.discover();
        List<OrphanValueDto> result = new ArrayList<>(orphanIdToCanonical.size());
        for (Map.Entry<Long, Value> entry : orphanIdToCanonical.entrySet()) {
            Value orphan = valueRepo.findById(entry.getKey()).orElse(null);
            if (orphan == null) continue;
            Value canonical = entry.getValue();
            long refCount = valueReferenceRepointService.countReferencesSql(orphan.getId(), refMeta);
            result.add(new OrphanValueDto(
                    ngValueService.valueToDto(orphan),
                    ngValueService.valueToDto(canonical),
                    refCount));
        }
        // Largest reference count first — operators usually care about high-impact orphans.
        result.sort(Comparator.comparingLong(OrphanValueDto::getReferenceCount).reversed());
        log.info("findOrphanValues({}): {} orphan(s) found", categoryAlias, result.size());
        return result;
    }

    /**
     * Run the discovery from {@link #findOrphanValues} and, for each orphan→canonical
     * pair, invoke the existing {@link #mergeValues} primitive — which re-points every
     * entity FK and soft-deletes the orphan.
     *
     * <p>When {@code dryRun=true} no mutation happens; the operator sees the plan first
     * and can re-invoke with {@code dryRun=false} to apply.
     */
    public DedupOrphansResultDto dedupOrphans(String categoryAlias, boolean dryRun) {
        // Discovery walks the JPA metamodel for both scalar @ManyToOne Value
        // fields and @ManyToMany Set<Value> join tables, and validates the
        // resulting (table, column) pairs against INFORMATION_SCHEMA so a
        // wrongly-derived name doesn't poison the transaction.
        ValueReferenceRepointService.Metadata refMeta = valueReferenceRepointService.discover();

        List<OrphanValueDto> orphans = findOrphanValues(categoryAlias);

        DedupOrphansResultDto result = new DedupOrphansResultDto();
        result.setDryRun(dryRun);
        result.setCategoryAlias(categoryAlias);
        result.setOrphanCount(orphans.size());

        List<DedupOperationDto> ops = new ArrayList<>(orphans.size());
        long totalRefs = 0;

        for (OrphanValueDto pair : orphans) {
            Long orphanId = pair.getOrphan().getId();
            Long canonicalId = pair.getCanonical().getId();

            DedupOperationDto op = new DedupOperationDto();
            op.setOrphanId(orphanId);
            op.setOrphanName(pair.getOrphan().getName());
            op.setCanonicalId(canonicalId);
            op.setCanonicalName(pair.getCanonical().getName());

            try {
                // Each orphan pair runs in its own REQUIRES_NEW transaction.
                // If anything in the pair throws — count probe, repoint,
                // synthetic FieldChange emission, soft-delete — the per-pair
                // tx rolls back atomically (including the synthetic FieldChange
                // rows that joined this tx via trackEntityUpdateInCurrentTx).
                // Other pairs in the batch are unaffected, and we still return
                // a DedupOrphansResultDto with per-op statuses.
                long[] preAndPost = perPairTxTemplate.execute(status -> {
                    long preCount = valueReferenceRepointService.countReferencesSql(orphanId, refMeta);
                    op.setReferenceCount(preCount);

                    if (dryRun) {
                        op.setStatus("dry-run");
                        return new long[]{preCount, preCount};
                    }
                    // Load the canonical as a managed entity so JPA mutations on
                    // owners cleanly point at it.
                    Value canonical = valueRepo.findById(canonicalId).orElseThrow(
                            () -> new IllegalStateException("Canonical Value #" + canonicalId + " not found"));

                    // Repoint via JPA — @PostUpdate emits FieldChanges for scalar
                    // fields automatically. Collection mutations capture pending
                    // synthetic descriptors; emitPendingFieldChanges below joins
                    // this same tx so its FieldChange rows commit/roll back
                    // atomically with the JPA repoint.
                    ValueReferenceRepointService.RepointOutcome outcome =
                            valueReferenceRepointService.repointAllReferences(orphanId, canonical, refMeta);

                    // Flush so the native post-count sees the in-memory updates.
                    entityManager.flush();

                    // Emit synthetic FieldChanges for the collection mutations.
                    // Joins this pair tx (MANDATORY propagation), so if anything
                    // later in the pair throws, these rows roll back too.
                    valueReferenceRepointService.emitPendingFieldChanges(
                            outcome.pendingCollectionFieldChanges);

                    long postCount = valueReferenceRepointService.countReferencesSql(orphanId, refMeta);
                    if (postCount > 0) {
                        Map<String, Long> breakdown = valueReferenceRepointService
                                .countReferencesByLocationSql(orphanId, refMeta);
                        op.setStatus("aborted (rolled back): " + postCount + " reference(s) still point at orphan after re-point. Locations: " + breakdown);
                        log.error("dedupOrphans: pair {}→{} aborted — {} reference(s) still dangling; rolling pair back. Breakdown: {}",
                                orphanId, canonicalId, postCount, breakdown);
                        // Roll the pair tx back. Without this, the partial JPA
                        // repoint AND the synthetic FieldChanges from emit would
                        // commit, leaving the hub in a half-merged state where
                        // some references point at canonical and others at the
                        // still-alive orphan. Rolling back means the operator
                        // can fix the helper's discovery (missing FK column,
                        // unmapped reference shape) and re-run cleanly.
                        status.setRollbackOnly();
                    } else {
                        // Safe — every known reference is gone. Soft-delete the
                        // orphan via repo so the listener emits a DELETE FieldChange.
                        valueRepo.findById(orphanId).ifPresent(v -> {
                            v.setDeleted(true);
                            valueRepo.save(v);
                        });
                        // Write the dedup remap so future incoming sync changes
                        // that reference this admin-deleted orphan ID get
                        // redirected to canonical. Sync-time merge does this
                        // too; both paths must stay symmetric or clients can
                        // ship changes targeting an orphan ID that the hub
                        // has soft-deleted and filtered out via @Where.
                        // Fail-loud — if the remap insert throws, the pair tx
                        // rolls back so we don't soft-delete without redirect.
                        valueReferenceRepointService.persistDedupRemap("Value", orphanId, canonicalId);
                        op.setStatus("merged (" + outcome.ownerRowsTouched + " owner row(s) re-pointed via JPA)");
                    }
                    return new long[]{preCount, postCount};
                });
                totalRefs += preAndPost[0];
            } catch (Exception e) {
                op.setStatus("error: " + (e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName()));
                log.error("dedupOrphans: merge {}→{} failed",
                        orphanId, canonicalId, e);
            }
            ops.add(op);
        }

        result.setTotalReferencesAffected(totalRefs);
        result.setOperations(ops);

        log.info("dedupOrphans({}, dryRun={}): {} orphan(s), {} references {}",
                categoryAlias, dryRun, orphans.size(), totalRefs,
                dryRun ? "would be re-pointed" : "re-pointed");
        return result;
    }

    // ==================== RECOVERY ====================

    /**
     * Resurrect Values that are still referenced by an entity FK but were soft-deleted.
     * <p>
     * This undoes the situation where the old (reflection-based) merge soft-deleted an
     * orphan without successfully re-pointing the FKs that referenced it — leaving
     * "dangling" FK columns pointing at {@code val_table} rows with {@code deleted=true},
     * which Hibernate's {@code @Where} clause then filters out, so the dropdown shows empty.
     *
     * <p>Algorithm:
     * <ol>
     *   <li>Use SQL to collect every distinct Value id referenced by any known FK column.</li>
     *   <li>For each, run an UPDATE that flips {@code deleted=false} only when it's currently
     *       {@code true}. Idempotent and only affects dangling cases.</li>
     * </ol>
     * Returns {@code referencedIds} (total count of referenced ids) and {@code resurrected}
     * (how many were dangling and got flipped back) so the operator can see the impact.
     */
    public Map<String, Object> recoverDanglingReferences() {
        Map<String, List<String>> fkColumns = valueReferenceRepointService.discover().fkColumns;

        Set<Long> referencedValueIds = new HashSet<>();
        for (var entry : fkColumns.entrySet()) {
            String table = entry.getKey();
            for (String column : entry.getValue()) {
                try {
                    @SuppressWarnings("unchecked")
                    List<Number> ids = entityManager.createNativeQuery(
                            "SELECT DISTINCT " + column + " FROM " + table + " WHERE " + column + " IS NOT NULL")
                            .getResultList();
                    for (Number id : ids) if (id != null) referencedValueIds.add(id.longValue());
                } catch (Exception e) {
                    log.debug("recoverDanglingReferences: skipping {}.{}: {}", table, column, e.getMessage());
                }
            }
        }

        if (referencedValueIds.isEmpty()) {
            log.info("recoverDanglingReferences: no referenced Value ids found");
            return Map.of(
                    "referencedIds", 0,
                    "resurrected", 0,
                    "scannedTables", fkColumns.size());
        }

        // Flip deleted=true → deleted=false for referenced rows only. One UPDATE.
        int resurrected = entityManager.createNativeQuery(
                "UPDATE val_table SET deleted = false WHERE deleted = true AND id IN (:ids)")
                .setParameter("ids", referencedValueIds)
                .executeUpdate();

        log.info("recoverDanglingReferences: scanned {} table(s), {} unique referenced Value id(s), {} resurrected",
                fkColumns.size(), referencedValueIds.size(), resurrected);

        return Map.of(
                "referencedIds", referencedValueIds.size(),
                "resurrected", resurrected,
                "scannedTables", fkColumns.size());
    }
}
