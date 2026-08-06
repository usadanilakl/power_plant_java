package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.dk_power.power_plant_java.sevice.ServiceFacade;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Field;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Human labels for entity ids — the presentation layer over the sync tooling's id-only world.
 *
 * <p><b>Why this exists:</b> {@code SyncComparisonService.serializeValue} flattens every referenced
 * {@link BaseIdEntity} to its bare id and every entity collection to a JSON id array, because that map
 * feeds {@link SyncContentHasher} and MUST hash identically to the hub. That makes the drift UI read
 * {@code isoPos: 4711} / {@code lotoPoints: [88,91]} — accurate, useless to a human. This service is a
 * SEPARATE, ADDITIVE layer: it never changes a serialized value, it only supplies a label alongside it,
 * so the hash contract is untouched.
 *
 * <p>Runs on desktop AND hub (no {@code sync.role} condition): the desktop labels its local ids, the hub
 * labels ids the desktop doesn't have (a field that DIFFERS often references a row that is missing
 * locally — that is frequently the very reason it differs).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SyncLabelService {

    private final ServiceFacade serviceFacade;
    private final ObjectMapper objectMapper;

    /** How to build a label for a type: first non-blank of {@code primary}, optionally + " · " + detail. */
    private record LabelRule(List<String> primary, String detail) {}

    /**
     * Per-type overrides where the default chain picks the wrong (or a useless) field. Everything else
     * falls through to {@link #DEFAULT_PRIMARY} — which is the convention already proven by the
     * "missing from local" strip.
     */
    private static final Map<String, LabelRule> RULES = Map.ofEntries(
            Map.entry("Value", new LabelRule(List.of("name"), null)),
            Map.entry("Category", new LabelRule(List.of("name"), null)),
            Map.entry("LotoPoint", new LabelRule(List.of("tagNumber"), "description")),
            Map.entry("Equipment", new LabelRule(List.of("tagNumber", "name"), "description")),
            Map.entry("LotoStandard", new LabelRule(List.of("name"), "description")),
            Map.entry("FileObject", new LabelRule(List.of("name", "fileNumber", "docNum"), null)),
            Map.entry("ZeroEnergy", new LabelRule(List.of("method"), null)),
            Map.entry("User", new LabelRule(List.of("username", "name"), null)),
            Map.entry("Loto", new LabelRule(List.of("permitNumber"), "description"))
    );

    /** Default label chain — same order as the original NgDriftController.labelFrom convention. */
    private static final List<String> DEFAULT_PRIMARY =
            List.of("tagNumber", "name", "permitNumber", "title", "description", "fileNumber");

    private static final int PRIMARY_MAX = 60;
    private static final int DETAIL_MAX = 40;
    /** Labels are near-static (a Value rename is rare); a short TTL keeps a rename visible without churn. */
    private static final long TTL_MS = 300_000;
    /** Bounded so a big scan can't grow the cache without limit. */
    private static final int MAX_CACHE = 20_000;

    private record CachedLabel(String label, long expiresAt) {
        boolean expired() { return System.currentTimeMillis() > expiresAt; }
    }

    private final Map<String, CachedLabel> cache = new ConcurrentHashMap<>();
    private static final Map<Class<?>, Map<String, Field>> FIELD_CACHE = new ConcurrentHashMap<>();

    // ==================== Local resolution ====================

    /** Human label for one LOCAL entity, or {@code #id} when it can't be resolved (missing/deleted/no service). */
    @Transactional(readOnly = true)
    public String labelFor(String entityType, Long id) {
        if (entityType == null || id == null) return "#" + id;
        String key = entityType + "#" + id;
        CachedLabel hit = cache.get(key);
        if (hit != null && !hit.expired()) return hit.label();

        String label = "#" + id;
        try {
            SyncableService<?> service = serviceFacade.getService(entityType);
            Object entity = service != null ? service.getEntityById(id) : null;
            if (entity != null) label = labelFromEntity(entityType, entity, id);
        } catch (Exception e) {
            log.trace("label lookup failed for {}#{}: {}", entityType, id, e.getMessage());
        }
        put(key, label);
        return label;
    }

    /** Batch variant — same rules, one cache pass. Never throws; unresolvable ids come back as {@code #id}. */
    @Transactional(readOnly = true)
    public Map<Long, String> labelsFor(String entityType, Collection<Long> ids) {
        Map<Long, String> out = new LinkedHashMap<>();
        if (ids == null) return out;
        for (Long id : ids) if (id != null) out.put(id, labelFor(entityType, id));
        return out;
    }

    // ==================== Resolution from an already-fetched field map (hub side) ====================

    /**
     * Label from a serialized field map — the form the hub returns from
     * {@code /api/sync/entity/{type}/{id}}. Same rules as the local path, so a hub-only row and a local
     * row read identically in the UI.
     */
    public String labelFromData(String entityType, Map<String, String> data, Long id) {
        if (data == null || data.isEmpty()) return "#" + id;
        LabelRule rule = RULES.get(entityType);
        List<String> primary = rule != null ? rule.primary() : DEFAULT_PRIMARY;

        String base = null;
        for (String f : primary) {
            String v = clean(data.get(f));
            if (v != null) { base = truncate(v, PRIMARY_MAX); break; }
        }
        if (base == null) {
            // Type has an override that didn't hit — fall back to the generic chain before giving up.
            for (String f : DEFAULT_PRIMARY) {
                String v = clean(data.get(f));
                if (v != null) { base = truncate(v, PRIMARY_MAX); break; }
            }
        }
        if (base == null) return "#" + id;

        if (rule != null && rule.detail() != null) {
            String d = clean(data.get(rule.detail()));
            if (d != null && !d.equalsIgnoreCase(base)) base = base + " · " + truncate(d, DETAIL_MAX);
        }
        return base;
    }

    // ==================== Ref-value rendering ====================

    /**
     * Every id referenced by a serialized value — a bare id ({@code "4711"}) or a JSON id array
     * ({@code "[88,91]"}), which are the only two shapes {@code serializeValue} produces for entity refs.
     * Returns empty for anything else, so a caller can safely try this on any field.
     */
    public List<Long> extractIds(String serializedValue) {
        String v = serializedValue == null ? null : serializedValue.trim();
        if (v == null || v.isEmpty() || "null".equals(v)) return List.of();
        try {
            if (v.startsWith("[")) {
                List<?> raw = objectMapper.readValue(v, List.class);
                List<Long> ids = new ArrayList<>(raw.size());
                for (Object o : raw) {
                    if (o instanceof Number n) ids.add(n.longValue());
                    else if (o != null) { try { ids.add(Long.parseLong(o.toString().trim())); } catch (NumberFormatException ignored) {} }
                }
                return ids;
            }
            return List.of(Long.parseLong(v));
        } catch (Exception e) {
            return List.of();
        }
    }

    /**
     * Render a serialized ref value with the supplied id-&gt;label map: {@code "4711"} → {@code "OPEN"},
     * {@code "[88,91,…]"} → {@code "PUMP-A, PUMP-B, +12 more"}. Returns null when there is nothing to
     * label (not a ref shape, or no label resolved) so the UI can fall back to the raw value.
     */
    public String renderRefValue(String serializedValue, Map<Long, String> labels) {
        List<Long> ids = extractIds(serializedValue);
        if (ids.isEmpty() || labels == null || labels.isEmpty()) return null;

        List<String> parts = new ArrayList<>();
        int shown = 0;
        boolean anyResolved = false;
        for (Long id : ids) {
            String l = labels.get(id);
            if (l != null && !l.equals("#" + id)) anyResolved = true;
            if (shown < REF_LIST_LIMIT) { parts.add(l != null ? l : "#" + id); shown++; }
        }
        if (!anyResolved) return null; // nothing resolved — raw ids are no worse, and honest
        if (ids.size() > shown) parts.add("+" + (ids.size() - shown) + " more");
        return String.join(", ", parts);
    }

    /** How many collection members to name before collapsing into "+N more". */
    private static final int REF_LIST_LIMIT = 8;

    // ==================== internals ====================

    private String labelFromEntity(String entityType, Object entity, Long id) {
        LabelRule rule = RULES.get(entityType);
        List<String> primary = rule != null ? rule.primary() : DEFAULT_PRIMARY;

        String base = firstNonBlank(entity, primary);
        if (base == null && rule != null) base = firstNonBlank(entity, DEFAULT_PRIMARY);
        if (base == null) return "#" + id;
        base = truncate(base, PRIMARY_MAX);

        if (rule != null && rule.detail() != null) {
            String d = clean(readField(entity, rule.detail()));
            if (d != null && !d.equalsIgnoreCase(base)) base = base + " · " + truncate(d, DETAIL_MAX);
        }
        return base;
    }

    private String firstNonBlank(Object entity, List<String> fields) {
        for (String f : fields) {
            String v = clean(readField(entity, f));
            if (v != null) return v;
        }
        return null;
    }

    /** Read a field by name, walking the class hierarchy (tagNumber/name live on base classes). */
    private String readField(Object entity, String name) {
        Map<String, Field> fields = FIELD_CACHE.computeIfAbsent(entity.getClass(), SyncLabelService::buildFieldMap);
        Field f = fields.get(name);
        if (f == null) return null;
        try {
            Object v = f.get(entity);
            return v != null ? String.valueOf(v) : null;
        } catch (Exception e) {
            return null;
        }
    }

    private static Map<String, Field> buildFieldMap(Class<?> clazz) {
        Map<String, Field> map = new HashMap<>();
        Class<?> current = clazz;
        while (current != null && current != Object.class) {
            for (Field f : current.getDeclaredFields()) {
                if (map.containsKey(f.getName())) continue; // subclass wins
                if (!(f.getType() == String.class || Number.class.isAssignableFrom(f.getType()))) continue;
                f.setAccessible(true);
                map.put(f.getName(), f);
            }
            current = current.getSuperclass();
        }
        return map;
    }

    private void put(String key, String label) {
        if (cache.size() >= MAX_CACHE) cache.clear(); // crude but bounded; labels are cheap to re-resolve
        cache.put(key, new CachedLabel(label, System.currentTimeMillis() + TTL_MS));
    }

    private static String clean(String v) {
        if (v == null) return null;
        String t = v.trim();
        return (t.isEmpty() || "null".equals(t)) ? null : t;
    }

    private static String truncate(String v, int max) {
        return v.length() > max ? v.substring(0, max) + "…" : v;
    }

    /** Drop cached labels (after a reconcile pulls new rows down, or on demand from admin tooling). */
    public void clearCache() { cache.clear(); }
}
