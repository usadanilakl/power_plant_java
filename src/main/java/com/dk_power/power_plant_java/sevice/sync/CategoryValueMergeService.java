package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.categories.Category;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.sevice.ServiceFacade;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class CategoryValueMergeService {

    private final ServiceFacade serviceFacade;
    private final EntityTableRegistry entityTableRegistry;

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * Detect and merge duplicate Categories and Values.
     * Called after a sync batch is applied.
     * Runs outside SyncContext so changes are tracked and synced.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void mergeIfDuplicatesExist() {
        int mergedCategories = mergeCategories();
        int mergedValues = mergeValues();

        if (mergedCategories > 0 || mergedValues > 0) {
            log.info("Merge complete: {} categories, {} values deduplicated",
                mergedCategories, mergedValues);
        }
    }

    @SuppressWarnings("unchecked")
    private int mergeCategories() {
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

    private int mergeCategoriesByName(String name) {
        List<Category> categories = entityManager.createQuery(
            "SELECT c FROM Category c WHERE LOWER(c.name) = LOWER(:name) AND c.deleted = false ORDER BY c.id",
            Category.class)
            .setParameter("name", name)
            .getResultList();

        if (categories.size() <= 1) return 0;

        Category canonical = categories.get(0);
        int merged = 0;

        for (int i = 1; i < categories.size(); i++) {
            Category duplicate = categories.get(i);

            List<Value> values = entityManager.createQuery(
                "SELECT v FROM Value v WHERE v.category.id = :catId AND v.deleted = false",
                Value.class)
                .setParameter("catId", duplicate.getId())
                .getResultList();

            for (Value value : values) {
                value.setCategory(canonical);
                entityManager.merge(value);
            }

            // Use native SQL to soft-delete — @Where(clause = "deleted = false") on Category
            // prevents JPA from updating entities that have deleted=true
            entityManager.createNativeQuery(
                "UPDATE category SET deleted = true WHERE id = :id")
                .setParameter("id", duplicate.getId())
                .executeUpdate();
            entityManager.detach(duplicate);
            merged++;

            log.info("Category merge: '{}' ID={} merged into ID={}, {} values re-pointed",
                name, duplicate.getId(), canonical.getId(), values.size());
        }

        return merged;
    }

    @SuppressWarnings("unchecked")
    private int mergeValues() {
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

    private int mergeValuesByNameAndCategory(String name, Long categoryId) {
        List<Value> values = entityManager.createQuery(
            "SELECT v FROM Value v WHERE LOWER(v.name) = LOWER(:name) " +
            "AND v.category.id = :catId AND v.deleted = false ORDER BY v.id",
            Value.class)
            .setParameter("name", name)
            .setParameter("catId", categoryId)
            .getResultList();

        if (values.size() <= 1) return 0;

        Value canonical = values.get(0);
        int merged = 0;

        for (int i = 1; i < values.size(); i++) {
            Value duplicate = values.get(i);
            refactorAllReferences(duplicate, canonical);

            // Use native SQL to soft-delete — @Where(clause = "deleted = false") on Value
            // prevents JPA from updating entities that have deleted=true
            entityManager.createNativeQuery(
                "UPDATE val_table SET deleted = true WHERE id = :id")
                .setParameter("id", duplicate.getId())
                .executeUpdate();
            entityManager.detach(duplicate);
            merged++;

            log.info("Value merge: '{}' (cat={}) ID={} merged into ID={}",
                name, categoryId, duplicate.getId(), canonical.getId());
        }

        return merged;
    }

    /**
     * Re-point all references from duplicate Value to canonical Value
     * across all registered entity types.
     *
     * Uses each service's refactorValues() method which handles
     * reflection-based field discovery and update.
     * Each updated entity triggers FieldChangeEntityListener,
     * so changes sync to all other clients automatically.
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
}
