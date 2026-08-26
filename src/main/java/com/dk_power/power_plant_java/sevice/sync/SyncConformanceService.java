package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.repository.sync.FieldChangeRepository;
import com.dk_power.power_plant_java.sevice.ServiceFacade;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import jakarta.persistence.Column;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.metamodel.EntityType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.math.BigDecimal;
import java.math.BigInteger;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

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
    private final FieldChangeRepository fieldChangeRepository;
    private final PlatformTransactionManager transactionManager;

    /** Sentinel: this field's Java type has no supported scalar mutation. */
    private static final Object NO_MUTATION = new Object();
    /** Tracked scalars that must NOT be mutated: identity/audit/soft-delete/version — mutating them is noise or corruption. */
    private static final Set<String> HARD_SKIP = Set.of(
            "id", "deleted", "dateCreated", "dateModified", "version", "objectType", "lastLoginDate", "createdBy", "modifiedBy");
    private final AtomicLong token = new AtomicLong(1000);

    // ---- External-integration isolation guard (read for the safety check below) ----
    @Value("${sharepoint.sync.enabled:false}") private boolean sharepointSyncEnabled;
    @Value("${sharepoint.azure.client-id:}") private String sharepointClientId;
    @Value("${sharepoint.site.hostname:}") private String sharepointHostname;
    @Value("${maximo.api-key:}") private String maximoApiKey;
    @Value("${supabase.url:}") private String supabaseUrl;
    @Value("${supabase.enabled:true}") private boolean supabaseEnabled;

    private static boolean blank(String s) { return s == null || s.isBlank(); }

    /**
     * True only when every external integration is provably OFF on this node: SharePoint push disabled
     * (and either no client-id, so its beans never load, or the hostname is the test '.invalid' sentinel),
     * no Maximo api-key (its beans are @ConditionalOnProperty and absent), and no live Supabase. A Phase-2
     * MUTATION must never run unless this holds — otherwise seeding throwaways of SharePoint-synced types
     * (WorkRequest, Instrument, SDS, …) would push SYNC_CONFORMANCE_ garbage to the real SharePoint/Maximo/
     * Supabase (the prod hub has all three live).
     */
    public boolean isIsolated() {
        boolean spOff = !sharepointSyncEnabled
                && (blank(sharepointClientId) || sharepointHostname.contains("invalid") || blank(sharepointHostname));
        boolean maximoOff = blank(maximoApiKey);
        boolean supabaseOff = blank(supabaseUrl) || !supabaseEnabled;
        return spOff && maximoOff && supabaseOff;
    }

    /** Transparent view of every isolation input, so you can confirm a node is safe BEFORE running a sweep. */
    public Map<String, Object> isolationStatus() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("isolated", isIsolated());
        m.put("sharepointSyncEnabled", sharepointSyncEnabled);
        m.put("sharepointClientIdPresent", !blank(sharepointClientId));
        m.put("sharepointHostname", sharepointHostname);
        m.put("maximoApiKeyPresent", !blank(maximoApiKey));
        m.put("supabaseUrlPresent", !blank(supabaseUrl));
        m.put("supabaseEnabled", supabaseEnabled);
        m.put("note", isIsolated()
                ? "Safe: all external integrations are off — mutation sweeps are permitted."
                : "BLOCKED: an external integration is live — mutation sweeps are refused so no test data reaches SharePoint/Maximo/Supabase.");
        return m;
    }

    /** Guard every Phase-2 mutation entry point with this. */
    public void assertIsolatedOrThrow() {
        if (!isIsolated()) {
            throw new IllegalStateException("Sync-conformance mutations refused: external integrations are live on this node "
                    + "(sharepointSyncEnabled=" + sharepointSyncEnabled + ", maximoApiKeyPresent=" + !blank(maximoApiKey)
                    + ", supabaseUrlPresent=" + !blank(supabaseUrl) + "). Run only on an isolated lab node. See /isolation-status.");
        }
    }

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

    // ==================== Generator 1: scalar field sweep (emission) ====================
    // For each tracked SCALAR / FK-less field of an entity, mutate ONLY that field on an existing instance,
    // save through the real service (fires @PreUpdate/@PostUpdate), assert a FieldChange was emitted for THAT
    // field, then restore. Collections/relationships are NOT covered here (a raw field-set never emits — they
    // are covered by the endpoint operation tests). Mutate-and-restore leaves the row unchanged; the isolation
    // guard makes it lab-only. Each mutation + restore runs in its own committed tx so emission is durable and
    // the assertion reads a committed row.

    /** Field sweep for one entity type. */
    @SuppressWarnings({"unchecked", "rawtypes"})
    public List<ConformanceResult> fieldSweep(String entityType) {
        assertIsolatedOrThrow();
        List<ConformanceResult> results = new ArrayList<>();
        Class<?> clazz = enumerateSyncedTypes().stream()
                .filter(c -> c.getSimpleName().equals(entityType)).findFirst().orElse(null);
        if (clazz == null) { results.add(skip(entityType, null, null, "unknown / non-synced type")); return results; }
        SyncableService svc;
        try { svc = serviceFacade.getService(entityType); }
        catch (Exception e) { results.add(skip(entityType, null, null, "service resolve error: " + rootMsg(e))); return results; }
        if (svc == null) { results.add(skip(entityType, null, null, "no ServiceFacade service (registration gap)")); return results; }

        BaseIdEntity sample;
        try {
            List<BaseIdEntity> all = svc.getAll();
            if (all == null || all.isEmpty()) { results.add(skip(entityType, null, null, "no existing instance to sweep")); return results; }
            sample = all.get(0);
        } catch (Exception e) { results.add(skip(entityType, null, null, "getAll failed: " + rootMsg(e))); return results; }
        final Long id = sample.getId();

        TransactionTemplate txNew = new TransactionTemplate(transactionManager);
        txNew.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);

        for (FieldChangeTracker.TrackedFieldInfo f : fieldChangeTracker.getTrackedFields(clazz)) {
            if (!f.shouldTrack()) continue;
            if (f.relationshipType() != null) {
                results.add(new ConformanceResult(entityType, id, f.fieldName(), f.relationshipType(), null, false, null, true,
                        "skipped: " + f.relationshipType() + " (covered by endpoint operation tests, not the scalar sweep)"));
                continue;
            }
            if (HARD_SKIP.contains(f.fieldName())) {
                results.add(new ConformanceResult(entityType, id, f.fieldName(), "scalar", null, false, null, true, "skipped: forbidden/no-emit field"));
                continue;
            }
            results.add(sweepOneScalar(entityType, id, f, svc, txNew));
        }
        return results;
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    private ConformanceResult sweepOneScalar(String type, Long id, FieldChangeTracker.TrackedFieldInfo f,
                                             SyncableService svc, TransactionTemplate txNew) {
        Field field = f.field();
        Class<?> ft = field.getType();
        Instant since = Instant.now().minusSeconds(1);
        final Object[] captured = new Object[1];
        final boolean[] mutated = {false};
        final String[] kind = {ft.getSimpleName()};
        try {
            txNew.execute(s -> {
                try {
                    BaseIdEntity e = svc.getEntityById(id);
                    if (e == null) return null;
                    Object old = field.get(e);
                    captured[0] = old;
                    Object nv = newScalarValue(ft, old, field);
                    if (nv == NO_MUTATION) return null;
                    field.set(e, nv);
                    svc.saveAndFlush(e);
                    mutated[0] = true;
                } catch (Exception ex) { throw new RuntimeException(ex); }
                return null;
            });
        } catch (Exception ex) {
            return new ConformanceResult(type, id, f.fieldName(), "scalar", kind[0], false, null, true, "mutate error: " + rootMsg(ex));
        }
        if (!mutated[0]) {
            return new ConformanceResult(type, id, f.fieldName(), "scalar", null, false, null, true, "skipped: unsupported type " + ft.getSimpleName());
        }

        boolean emitted;
        try {
            List<FieldChange> fcs = fieldChangeRepository.findByEntityTypeAndEntityIdAndTimestampAfter(type, id, since);
            emitted = fcs.stream().anyMatch(fc -> f.fieldName().equals(fc.getFieldName()));
        } catch (Exception ex) { emitted = false; }

        // Restore (best-effort) so the row is left unchanged.
        try {
            txNew.execute(s -> {
                try { BaseIdEntity e = svc.getEntityById(id); if (e != null) { field.set(e, captured[0]); svc.saveAndFlush(e); } }
                catch (Exception ex) { throw new RuntimeException(ex); }
                return null;
            });
        } catch (Exception ignore) { /* restore is best-effort */ }

        return new ConformanceResult(type, id, f.fieldName(), "scalar", kind[0], emitted, null, false,
                emitted ? "emitted OK" : "NO FieldChange emitted for this field — EMISSION GAP");
    }

    /** Field sweep across every synced type. Summary + the emission gaps first. */
    public Map<String, Object> fieldSweepAll() {
        assertIsolatedOrThrow();
        List<ConformanceResult> all = new ArrayList<>();
        for (Class<?> c : enumerateSyncedTypes()) {
            try { all.addAll(fieldSweep(c.getSimpleName())); }
            catch (Exception e) { all.add(skip(c.getSimpleName(), null, null, "sweep error: " + rootMsg(e))); }
        }
        List<ConformanceResult> gaps = all.stream().filter(r -> !r.skipped() && !r.emitted()).toList();
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("checked", all.size());
        out.put("emitted", all.stream().filter(ConformanceResult::emitted).count());
        out.put("EMISSION_GAPS", gaps.size());
        out.put("skipped", all.stream().filter(ConformanceResult::skipped).count());
        out.put("gaps", gaps);
        out.put("results", all);
        return out;
    }

    /** New value for a scalar field: guaranteed different from {@code old}, valid for the column, or {@link #NO_MUTATION}. */
    private Object newScalarValue(Class<?> ft, Object old, Field field) {
        long t = token.incrementAndGet();
        if (ft == String.class) {
            int max = 255;
            Column col = field.getAnnotation(Column.class);
            if (col != null && col.length() > 0) max = col.length();
            String base = "cf" + t + (old == null ? "" : old.toString());
            return base.length() > max ? base.substring(0, max) : base;
        }
        if (ft == boolean.class || ft == Boolean.class) return old == null ? Boolean.TRUE : !((Boolean) old);
        if (ft == int.class || ft == Integer.class) return old == null ? 1 : ((Number) old).intValue() + 1;
        if (ft == long.class || ft == Long.class) return old == null ? 1L : ((Number) old).longValue() + 1L;
        if (ft == short.class || ft == Short.class) return old == null ? (short) 1 : (short) (((Number) old).shortValue() + 1);
        if (ft == byte.class || ft == Byte.class) return old == null ? (byte) 1 : (byte) (((Number) old).byteValue() + 1);
        if (ft == double.class || ft == Double.class) return old == null ? 1.0d : ((Number) old).doubleValue() + 1.0d;
        if (ft == float.class || ft == Float.class) return old == null ? 1.0f : ((Number) old).floatValue() + 1.0f;
        if (ft == BigDecimal.class) return old == null ? BigDecimal.ONE : ((BigDecimal) old).add(BigDecimal.ONE);
        if (ft == BigInteger.class) return old == null ? BigInteger.ONE : ((BigInteger) old).add(BigInteger.ONE);
        if (ft.isEnum()) {
            Object[] cs = ft.getEnumConstants();
            if (cs == null || cs.length == 0) return NO_MUTATION;
            for (Object c : cs) if (!c.equals(old)) return c;
            return NO_MUTATION;
        }
        if (ft == LocalDateTime.class) return old == null ? LocalDateTime.of(2020, 1, 1, 0, 0) : ((LocalDateTime) old).plusHours(1);
        if (ft == Instant.class) return old == null ? Instant.ofEpochSecond(1_600_000_000L) : ((Instant) old).plusSeconds(3600);
        if (ft == LocalDate.class) return old == null ? LocalDate.of(2020, 1, 1) : ((LocalDate) old).plusDays(1);
        if (ft == UUID.class) return UUID.randomUUID();
        return NO_MUTATION;
    }

    private ConformanceResult skip(String type, Long id, String field, String note) {
        return new ConformanceResult(type, id, field, null, null, false, null, true, note);
    }

    private String rootMsg(Throwable t) {
        while (t.getCause() != null && t.getCause() != t) t = t.getCause();
        return t.getClass().getSimpleName() + ": " + t.getMessage();
    }
}
