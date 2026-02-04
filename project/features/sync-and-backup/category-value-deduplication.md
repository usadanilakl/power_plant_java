# Functionality

Automatic deduplication of Category and Value entities during sync when two clients independently create the same categories and values (e.g., both run `DefaultValueGeneratorService.generateAllValues()` or both manually create the same category/value).

1. After a sync batch is applied, duplicate Categories (same name) and Values (same name under same category) are detected.
2. A merge operation runs: one canonical entity is kept, all downstream references are re-pointed to it, and the duplicate is soft-deleted.
3. The merge produces normal JPA field changes, which are tracked by `FieldChangeEntityListener` and synced to all other clients automatically.
4. After sync propagation, all machines converge to the same canonical IDs — no ongoing remapping or special handling needed.

Acceptance Criteria:
1. Machine A and Machine B both run `generateAllValues()` independently — after sync, each machine has exactly one Category per name and one Value per name+category, with no duplicates, and all share the same canonical IDs.
2. Values from both machines merge under the deduplicated Category (e.g., Machine A has "SWS", "DWS" under "System"; Machine B has "SWS", "FGS" under "System" — after sync, both machines have "SWS", "DWS", "FGS" under a single "System" category with the same IDs).
3. All downstream entities (Equipment, LotoPoint, FileObject, etc.) that referenced the duplicate Value are re-pointed to the canonical Value, and this change syncs to all clients.
4. Existing sync behavior for non-duplicate entities is unchanged.

# Architecture

## The problem

Sync uses entity IDs as identity. When two machines independently create Category "System", each gets a different auto-generated ID (e.g., ID=1 on Machine A, ID=5 on Machine B). During sync, `FieldSyncService` uses native SQL INSERT with the original ID, so after sync both machines have two Category rows with the same name but different IDs. Values and downstream entities split across the duplicates.

## The solution: post-sync merge

After `applyIncomingChanges()` completes and the sync batch is fully applied, a merge pass runs:

```
After sync batch applied:
    Category table has: "System" (ID=1), "System" (ID=5)    ← duplicates

Merge Phase 1 — Categories:
    Detect duplicates by name → "System" has IDs [1, 5]
    Canonical = lower ID → ID=1
    Re-point: all Values with category_id=5 → category_id=1
    Soft-delete Category ID=5

    Result: Value "FGS" (from Machine B, was under Category 5) now under Category 1

Merge Phase 2 — Values:
    After re-pointing, detect duplicate Values under same Category
    Category 1 now has: "SWS" (ID=10), "SWS" (ID=25), "DWS" (ID=11), "FGS" (ID=26)
    "SWS" is duplicated → canonical = ID=10 (lower ID)
    Re-point: all downstream entities referencing Value 25 → Value 10
    Soft-delete Value ID=25

    Result: Equipment that had system=25 now has system=10

All changes synced:
    Category#5: deleted=true                    → syncs to Machine B
    Value#25: deleted=true                      → syncs to Machine B
    Value#26: category changes 5→1              → syncs to Machine B
    Equipment#100: system changes 25→10         → syncs to Machine B
    (Machine B applies these via normal LWW)
```

This works because:
- The merge operations are **normal JPA field updates** — `FieldChangeEntityListener` creates FieldChange records automatically.
- The merge **clears SyncContext** before running, so changes are treated as local changes and synced to all other clients (see SyncContext clearing below).
- After all clients receive the merge changes, every machine has the **same canonical IDs** for every entity. No ongoing remapping needed.
- The merge is **idempotent** — running it multiple times produces no additional changes if duplicates are already resolved.
- Deterministic canonical selection (lower ID wins) means if two machines both detect and merge the same duplicates independently, they converge to the same result.

### SyncContext clearing

The merge is triggered from `FieldSyncService.applyIncomingChanges()` inside an `afterCommit()` callback. At that point, the thread's `SyncContext.isSyncing()` is still `true` (because `syncContext.endSync()` hasn't been called yet — it runs in the `finally` block of `CentralSyncService.applyIncomingChanges()`, which is after `transactionTemplate.execute()` returns, which is after `afterCommit()` fires).

If `isSyncing()` is true, `FieldChangeEntityListener` skips creating FieldChange records — this prevents dedup soft-deletes from being tracked and synced. To fix this, `CategoryValueMergeService.mergeIfDuplicatesExist()` temporarily clears SyncContext at the start and restores it at the end. This allows the entity listener to fire normally for all dedup changes.

## Downstream entity handling

When a duplicate Value is merged into the canonical Value, **all 25 FK columns across 11 entity types** that reference `val_table` must be checked and re-pointed. The existing `refactorValues(Value oldValue, Value newValue)` method in `NgCrudService` already handles this — it uses reflection to find all `@ManyToOne` fields of type `Value` on any entity and updates them.

Complete list of affected FK columns:

| Entity | Fields referencing Value |
|--------|------------------------|
| Equipment | `system`, `eqType`, `vendor`, `location` |
| LotoPoint | `processingStatus`, `isoPos`, `normPos`, `location`, `eqType`, `systemValue`, `vendor` |
| FileObject | `fileType`, `system`, `vendor` |
| Comment | `commentType` |
| LotoBox | `lotoAccessoryStatus` |
| Lock | `lotoAccessoryStatus` |
| ZeroEnergy | `zeroEnergyTemplate` |
| Task | `status` |
| Flow | `status` |
| BasePermitEntity (SafeWork, HotWork, ConfinedSpace, WorkRequest, DailyPermitPackage) | `system`, `permitType`, `permitStatus` |

For Category, only `Value.category` references the `category` table — a single FK column.

# Implementation

## Step 1: Create `CategoryValueMergeService`

New service that detects and merges duplicate Categories and Values after sync.

Create: `src/main/java/com/dk_power/power_plant_java/sevice/sync/CategoryValueMergeService.java`

```java
@Service
@Slf4j
@RequiredArgsConstructor
public class CategoryValueMergeService {

    private final CategoryRepo categoryRepo;
    private final ValueRepo valueRepo;
    private final ServiceFacade serviceFacade;
    private final EntityTableRegistry entityTableRegistry;

    @PersistenceContext
    private EntityManager entityManager;
}
```

## Step 2: Implement duplicate detection

Add a method that queries for duplicate Categories (same name, not deleted) and duplicate Values (same name + same category, not deleted).

```java
/**
 * Detect and merge duplicate Categories and Values.
 * Called after a sync batch is applied.
 * Runs outside SyncContext so changes are tracked and synced.
 */
@Transactional
public void mergeIfDuplicatesExist() {
    int mergedCategories = mergeCategories();
    int mergedValues = mergeValues();

    if (mergedCategories > 0 || mergedValues > 0) {
        log.info("Merge complete: {} categories, {} values deduplicated",
            mergedCategories, mergedValues);
    }
}
```

### Category duplicate detection

```java
private int mergeCategories() {
    // Find category names that appear more than once (excluding deleted)
    List<Object[]> duplicates = entityManager.createNativeQuery(
        "SELECT name, COUNT(*) FROM category WHERE deleted = false " +
        "GROUP BY LOWER(name) HAVING COUNT(*) > 1")
        .getResultList();

    int merged = 0;
    for (Object[] row : duplicates) {
        String name = (String) row[0];
        merged += mergeCategoriesByName(name);
    }
    return merged;
}
```

### Value duplicate detection

```java
private int mergeValues() {
    // Find values with same name under same category (after category merge)
    List<Object[]> duplicates = entityManager.createNativeQuery(
        "SELECT LOWER(name), category_id, COUNT(*) FROM val_table " +
        "WHERE deleted = false AND category_id IS NOT NULL " +
        "GROUP BY LOWER(name), category_id HAVING COUNT(*) > 1")
        .getResultList();

    int merged = 0;
    for (Object[] row : duplicates) {
        String name = (String) row[0];
        Long categoryId = ((Number) row[1]).longValue();
        merged += mergeValuesByNameAndCategory(name, categoryId);
    }
    return merged;
}
```

## Step 3: Implement Category merge

For each set of duplicate Categories, keep the one with the lowest ID (deterministic) and re-point all Values from duplicates to the canonical.

```java
private int mergeCategoriesByName(String name) {
    // Get all non-deleted categories with this name, ordered by ID
    List<Category> categories = entityManager.createQuery(
        "SELECT c FROM Category c WHERE LOWER(c.name) = LOWER(:name) AND c.deleted = false ORDER BY c.id",
        Category.class)
        .setParameter("name", name)
        .getResultList();

    if (categories.size() <= 1) return 0;

    Category canonical = categories.get(0); // Lowest ID wins
    int merged = 0;

    for (int i = 1; i < categories.size(); i++) {
        Category duplicate = categories.get(i);

        // Re-point all Values from duplicate to canonical Category
        List<Value> values = entityManager.createQuery(
            "SELECT v FROM Value v WHERE v.category.id = :catId AND v.deleted = false",
            Value.class)
            .setParameter("catId", duplicate.getId())
            .getResultList();

        for (Value value : values) {
            value.setCategory(canonical);
            valueRepo.save(value);
        }

        // Soft-delete via JPA merge so FieldChangeEntityListener fires
        duplicate.setDeleted(true);
        entityManager.merge(duplicate);
        entityManager.flush();
        merged++;

        log.info("Category merge: '{}' ID={} merged into ID={}, {} values re-pointed",
            name, duplicate.getId(), canonical.getId(), values.size());
    }

    return merged;
}
```

Since Value is the **only entity** with a FK to `category`, re-pointing Values is the only downstream operation needed for Category merges.

## Step 4: Implement Value merge with downstream re-pointing

For each set of duplicate Values, keep the one with the lowest ID and re-point all downstream entity references using the existing `refactorValues()` method.

```java
private int mergeValuesByNameAndCategory(String name, Long categoryId) {
    // Get all non-deleted values with this name under this category, ordered by ID
    List<Value> values = entityManager.createQuery(
        "SELECT v FROM Value v WHERE LOWER(v.name) = LOWER(:name) " +
        "AND v.category.id = :catId AND v.deleted = false ORDER BY v.id",
        Value.class)
        .setParameter("name", name)
        .setParameter("catId", categoryId)
        .getResultList();

    if (values.size() <= 1) return 0;

    Value canonical = values.get(0); // Lowest ID wins
    int merged = 0;

    for (int i = 1; i < values.size(); i++) {
        Value duplicate = values.get(i);
        refactorAllReferences(duplicate, canonical);

        // Soft-delete via JPA merge so FieldChangeEntityListener fires
        duplicate.setDeleted(true);
        entityManager.merge(duplicate);
        entityManager.flush();
        merged++;

        log.info("Value merge: '{}' (cat={}) ID={} merged into ID={}",
            name, categoryId, duplicate.getId(), canonical.getId());
    }

    return merged;
}
```

### Downstream re-pointing via `refactorValues()`

The `refactorValues(Value oldValue, Value newValue)` method in [NgCrudService](../../../src/main/java/com/dk_power/power_plant_java/sevice/angular/base/NgCrudService.java) already uses reflection to:
1. Iterate through all entities of that service's type.
2. Find all `@ManyToOne` fields of type `Value` (including superclass fields).
3. Replace `oldValue` with `newValue` on any matching field.
4. Save the entity.

This means calling `refactorValues()` on each registered service handles all 25 FK columns automatically, including fields added in the future.

```java
/**
 * Re-point all references from duplicateValue to canonicalValue
 * across all registered entity types.
 *
 * Uses each service's inherited refactorValues() method which
 * handles reflection-based field discovery and update.
 * Each updated entity triggers FieldChangeEntityListener,
 * so changes sync to all other clients automatically.
 */
private void refactorAllReferences(Value duplicate, Value canonical) {
    for (String entityType : entityTableRegistry.getSyncOrder()) {
        try {
            SyncableService service = serviceFacade.getService(entityType);
            if (service == null) continue;

            // Skip Category and Value — handled separately
            if ("Category".equals(entityType) || "Value".equals(entityType)) continue;

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
```

### What happens to each downstream entity

Concrete example: Machine A has Value "SWS" (ID=10), Machine B has Value "SWS" (ID=25). Machine B has Equipment "EQ-001" (ID=100) with `system=25`.

After sync on Machine A:
1. Both Values exist: "SWS" ID=10 and "SWS" ID=25 (both under Category "System" ID=1 after category merge).
2. Equipment#100 exists with `system=25` (synced from Machine B).
3. `mergeValues()` detects duplicate "SWS" under Category 1.
4. Canonical = ID=10 (lower). Duplicate = ID=25.
5. `refactorAllReferences(Value#25, Value#10)` iterates all services:
   - NgEquipmentService: scans all Equipment entities, finds Equipment#100 has `system=Value#25` → sets `system=Value#10` → saves.
   - NgFileService: scans FileObjects, finds none referencing Value#25 → no changes.
   - NgLotoPointService: scans LotoPoints → no changes.
   - (all other services checked automatically via reflection)
6. Value#25 soft-deleted.

FieldChange records generated (by FieldChangeEntityListener):
- `Equipment#100, field=system, oldValue=25, newValue=10` → syncs to Machine B
- `Value#25, field=deleted, oldValue=false, newValue=true` → syncs to Machine B

Machine B receives these changes via normal sync:
- Equipment#100: `system` updated from 25 to 10. LWW applies (merge timestamp is newer). Equipment now points to Value#10.
- Value#25: soft-deleted. No longer visible.

Result: Both machines have Equipment#100 with `system=Value#10`. Same canonical IDs everywhere.

## Step 5: Trigger merge after sync batch completes

Call `mergeIfDuplicatesExist()` from `FieldSyncService.applyIncomingChanges()` after the transaction commits. The merge must run **outside SyncContext** so that changes are tracked and synced.

[FieldSyncService](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/FieldSyncService.java) — `applyIncomingChanges()` method (line 292)

Add `CategoryValueMergeService` as a dependency. In the `afterCommit()` callback (inside the `TransactionSynchronization` registered at line 530), add the merge call:

```java
@Override
public void afterCommit() {
    // ... existing broadcast and file sync logic ...

    // Merge duplicate Categories and Values created by independent clients
    try {
        transactionTemplate.executeWithoutResult(status -> {
            categoryValueMergeService.mergeIfDuplicatesExist();
        });
    } catch (Exception e) {
        log.error("Category/Value merge failed: {}", e.getMessage(), e);
    }
}
```

The merge runs in its own transaction (via `transactionTemplate`) because `afterCommit()` runs outside the original transaction context. This is the same pattern already used for `handleValueNameChangesForFileStructure()`.

## Step 6: Handle Vendor/FileType Value merges (file structure)

When a duplicate Value under the "Vendor" or "File Type" category is merged, file paths on disk may need updating. The existing `NgFileService.refactorValues()` override already handles this — it captures old file links, updates references, and moves physical files. No additional code needed.

[NgFileService](../../../src/main/java/com/dk_power/power_plant_java/sevice/angular/file/NgFileService.java) — `refactorValues()` override handles file system operations automatically when Value references change on FileObject entities.

## Edge cases

**Idempotency**: If the merge runs multiple times (e.g., triggered by successive sync batches), the duplicate detection query returns no results after the first merge (duplicates are soft-deleted). No-op.

**Both machines merge simultaneously**: If Machine A and Machine B both detect duplicates and run the merge independently, they both pick the same canonical ID (lower ID wins — deterministic). Both produce the same changes (re-point to same canonical, delete same duplicate). When these changes cross-sync, LWW resolves them — identical changes with similar timestamps produce the same end state.

**Deleted entities**: Duplicate detection filters by `deleted = false`. Soft-deleted entities are excluded from merges. Soft-deletes are performed via JPA merge (not native SQL) so that `FieldChangeEntityListener` fires and creates FieldChange records — this ensures the deletion syncs to other machines and prevents permanent count mismatches in the health checker.

**Case sensitivity**: Duplicate detection uses `LOWER(name)` for case-insensitive matching, consistent with `Category.getValueByName()`.

**Alias differences**: If two machines created the same Category or Value with different aliases, the canonical entity keeps its alias. The duplicate's alias is lost (since the duplicate is soft-deleted). If needed, this could be enhanced to preserve the alias from the duplicate if the canonical has no alias.

**Large batch with many duplicates**: The merge iterates all entity types via `refactorValues()` for each duplicate Value. For N duplicate Values across M entity types, the cost is N*M service scans. Since categories and values are typically low-cardinality, this is acceptable.

## Core services affected

| Service | Change |
|---------|--------|
| [CategoryValueMergeService](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/CategoryValueMergeService.java) | New service: duplicate detection + merge logic |
| [FieldSyncService](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/FieldSyncService.java) | Add `CategoryValueMergeService` dependency, call `mergeIfDuplicatesExist()` in `afterCommit()` |

No changes needed to:
- Sync server (merge happens on the receiving client, changes sync normally)
- NgValueService (application-level creates already dedup by name)
- NgCrudService (existing `refactorValues()` is reused as-is)
- Category/Value entities
- FieldChangeTracker or other sync infrastructure
- Any downstream entity classes
