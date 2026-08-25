package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.dk_power.power_plant_java.sevice.ServiceFacade;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.metamodel.EntityType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.lang.reflect.Modifier;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Sync-conformance harness — Phase 1: coverage / discovery.
 *
 * <p>Reusable, test-only introspection over the sync model (bean absent in prod;
 * {@code sync.test-endpoints.enabled=true} to enable). It enumerates every SYNCED entity type —
 * a concrete {@link BaseIdEntity} subtype NOT marked {@link LocalOnlyEntity}, straight from the JPA
 * metamodel, the authoritative set (mirrors {@code SyncRegistryValidator}) — and, per type, classifies
 * its tracked fields with the SAME rules the emission path uses ({@link FieldChangeTracker#getTrackedFields},
 * so this can never drift from what sync actually tracks).
 *
 * <p>Headline output = the COLLECTION-FIELD INVENTORY: every owning {@code @ManyToMany}/{@code @OneToMany}
 * field across all synced entities. That is the complete surface where the "a collection-only mutation
 * changes just the join/child table, never fires {@code @PostUpdate}, and so emits nothing / never syncs"
 * bug class lives — the class that produced the {@code LotoStandard.lotoPoints} remove regression. It also
 * flags registration gaps (a synced type with no {@link ServiceFacade} handle).
 *
 * <p>Phase 2 (the mutation probe: seed a throwaway, perform the real operation, assert a FieldChange was
 * emitted for {@code (entityType, entityId, field)}, then assert hub convergence) builds on this layer.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "sync.test-endpoints.enabled", havingValue = "true")
public class SyncConformanceService {

    @PersistenceContext
    private EntityManager entityManager;

    private final FieldChangeTracker fieldChangeTracker;
    private final ServiceFacade serviceFacade;

    /**
     * Every synced entity CLASS: concrete {@link BaseIdEntity} subtype, not abstract, not
     * {@link LocalOnlyEntity}. Copied from the {@code SyncRegistryValidator} metamodel idiom so the
     * harness measures the same set sync itself considers authoritative.
     */
    public List<Class<?>> enumerateSyncedTypes() {
        List<Class<?>> out = new ArrayList<>();
        for (EntityType<?> et : entityManager.getMetamodel().getEntities()) {
            Class<?> java = et.getJavaType();
            if (java == null) continue;
            if (!BaseIdEntity.class.isAssignableFrom(java)) continue;
            if (Modifier.isAbstract(java.getModifiers())) continue;
            if (java.isAnnotationPresent(LocalOnlyEntity.class)) continue;
            out.add(java);
        }
        out.sort(Comparator.comparing(Class::getSimpleName));
        return out;
    }

    /**
     * The collection-field inventory: every owning {@code @ManyToMany}/{@code @OneToMany} tracked field
     * across all synced types. A mutation of one of these changes ONLY a join/child table, so it risks not
     * firing {@code @PostUpdate} → not emitting → not syncing. Each entry is a candidate for a Phase-2 probe.
     */
    public List<Map<String, Object>> discoverCollectionFields() {
        List<Map<String, Object>> out = new ArrayList<>();
        for (Class<?> clazz : enumerateSyncedTypes()) {
            for (FieldChangeTracker.TrackedFieldInfo f : fieldChangeTracker.getTrackedFields(clazz)) {
                if (!f.shouldTrack()) continue;
                String rel = f.relationshipType();
                if (!"ManyToMany".equals(rel) && !"OneToMany".equals(rel)) continue;
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("entityType", clazz.getSimpleName());
                row.put("field", f.fieldName());
                row.put("relationshipType", rel);
                out.add(row);
            }
        }
        return out;
    }

    /** Synced types whose {@link ServiceFacade} lookup is null — a registration gap (can't be seeded/loaded generically). */
    public List<String> registrationGaps() {
        List<String> gaps = new ArrayList<>();
        for (Class<?> clazz : enumerateSyncedTypes()) {
            try {
                if (serviceFacade.getService(clazz.getSimpleName()) == null) gaps.add(clazz.getSimpleName());
            } catch (Exception e) {
                gaps.add(clazz.getSimpleName() + " (resolve error: " + e.getMessage() + ")");
            }
        }
        return gaps;
    }

    /** One call for the driver/UI: synced-type count + list, the collection-field inventory, and registration gaps. */
    public Map<String, Object> coverageReport() {
        List<Class<?>> types = enumerateSyncedTypes();
        List<Map<String, Object>> collections = discoverCollectionFields();
        List<String> gaps = registrationGaps();
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("syncedTypeCount", types.size());
        out.put("syncedTypes", types.stream().map(Class::getSimpleName).toList());
        out.put("collectionFieldCount", collections.size());
        out.put("collectionFields", collections);
        out.put("registrationGaps", gaps);
        return out;
    }
}
