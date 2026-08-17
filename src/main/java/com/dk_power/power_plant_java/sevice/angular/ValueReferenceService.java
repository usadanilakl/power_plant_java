package com.dk_power.power_plant_java.sevice.angular;

import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.field_list.FieldListItem;
import com.dk_power.power_plant_java.repository.permits.WorkAreaRepo;
import com.dk_power.power_plant_java.sevice.sync.SyncLabelService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.metamodel.Attribute;
import jakarta.persistence.metamodel.EntityType;
import jakarta.persistence.metamodel.PluralAttribute;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Answers "what actually points at this Value?" across the whole model, and moves or removes those
 * links safely.
 *
 * <p>Reference discovery walks the JPA metamodel rather than a hand-written list of entity/field
 * pairs. That matters because the old delete path only knew about Equipment, FileObject and
 * LotoPoint — it would hard-delete a Value still referenced by FieldListItem, InventoryItem or
 * WorkArea and leave dangling FKs behind. Anything that gains a Value reference later is covered
 * here automatically.
 *
 * <p>All mutations go through JPA entity state (never bulk/native UPDATE) so
 * {@code FieldChangeEntityListener} fires and the change reaches the sync log.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ValueReferenceService {

    private final EntityManager entityManager;
    private final SyncLabelService syncLabelService;
    /** Used to re-home legacy rows whose work area was only implied by a Location Value's name. */
    private final WorkAreaRepo workAreaRepo;

    /** One entity that references the Value, already resolved to something a human can read. */
    public record ValueReference(
            String entityType,
            Long entityId,
            String entityLabel,
            String fieldName,
            boolean collection
    ) {}

    /** References grouped by entity type, for rendering as sections. */
    public record ValueReferenceGroup(String entityType, String fieldName, List<ValueReference> items) {}

    /** Full picture for the admin dialog. */
    public record ValueReferenceReport(Long valueId, int totalCount, List<ValueReferenceGroup> groups) {}

    /**
     * Every entity attribute in the model whose type is {@link Value}, singular or plural.
     * Recomputed per call — the metamodel is in-memory and this runs only from the admin screen.
     */
    private List<AttributeRef> valueAttributes() {
        List<AttributeRef> refs = new ArrayList<>();
        for (EntityType<?> et : entityManager.getMetamodel().getEntities()) {
            for (Attribute<?, ?> attr : et.getAttributes()) {
                if (attr instanceof PluralAttribute<?, ?, ?> plural) {
                    if (Value.class.equals(plural.getElementType().getJavaType())
                            && !isInverseSide(et, attr.getName())) {
                        refs.add(new AttributeRef(et, attr.getName(), true));
                    }
                } else if (Value.class.equals(attr.getJavaType())) {
                    refs.add(new AttributeRef(et, attr.getName(), false));
                }
            }
        }
        return refs;
    }

    /**
     * True for the INVERSE side of a bidirectional association (a {@code mappedBy} collection).
     *
     * <p>Such a collection is not an independent reference — it is the mirror of an FK the other
     * side already owns, so counting it double-counts at best. It mattered concretely for
     * {@code Category.values} ({@code @OneToMany(mappedBy = "category")}): every Value belongs to a
     * category, so that inverse collection reported one reference for EVERY value, permanently
     * blocking delete on a link that cannot be re-pointed (moving a value between categories is not
     * what re-pointing means). The owning side, {@code Value.category}, is a Category reference on
     * Value itself and is correctly never scanned here.
     *
     * <p>The category link needs no repoint step: soft-deleting the value leaves it in its category
     * with {@code deleted = true}, which {@code @Where} hides everywhere.
     */
    private boolean isInverseSide(EntityType<?> entityType, String fieldName) {
        try {
            Field field = findField(entityType.getJavaType(), fieldName);
            jakarta.persistence.OneToMany oneToMany = field.getAnnotation(jakarta.persistence.OneToMany.class);
            if (oneToMany != null && !oneToMany.mappedBy().isEmpty()) return true;
            jakarta.persistence.ManyToMany manyToMany = field.getAnnotation(jakarta.persistence.ManyToMany.class);
            return manyToMany != null && !manyToMany.mappedBy().isEmpty();
        } catch (NoSuchFieldException e) {
            // Property-access mapping or an odd hierarchy — treat as a real reference so the scan
            // errs toward blocking a delete rather than silently allowing an unsafe one.
            return false;
        }
    }

    private record AttributeRef(EntityType<?> entityType, String fieldName, boolean collection) {}

    @Transactional(readOnly = true)
    public ValueReferenceReport findReferences(Long valueId) {
        Map<String, ValueReferenceGroup> grouped = new LinkedHashMap<>();
        int total = 0;

        for (AttributeRef ref : valueAttributes()) {
            String entityName = ref.entityType().getName();
            List<?> hits;
            try {
                // @Where(deleted IS NOT TRUE) on the entity applies here, so soft-deleted rows are
                // correctly invisible — they must not block a delete.
                String jpql = ref.collection()
                        ? "SELECT e FROM " + entityName + " e JOIN e." + ref.fieldName() + " v WHERE v.id = :valueId"
                        : "SELECT e FROM " + entityName + " e WHERE e." + ref.fieldName() + ".id = :valueId";
                hits = entityManager.createQuery(jpql).setParameter("valueId", valueId).getResultList();
            } catch (Exception e) {
                // A mapping we can't query (odd inheritance, no id path) must not break the whole
                // report — surface it in the log and keep going.
                log.warn("[ValueReference] Could not scan {}.{}: {}", entityName, ref.fieldName(), e.getMessage());
                continue;
            }

            for (Object hit : hits) {
                Long id = hit instanceof BaseIdEntity base ? base.getId() : null;
                if (id == null) continue;
                String label = safeLabel(entityName, id);
                String key = entityName + "#" + ref.fieldName();
                grouped.computeIfAbsent(key, k -> new ValueReferenceGroup(entityName, ref.fieldName(), new ArrayList<>()))
                        .items()
                        .add(new ValueReference(entityName, id, label, ref.fieldName(), ref.collection()));
                total++;
            }
        }

        List<ValueReferenceGroup> groups = new ArrayList<>(grouped.values());
        groups.sort(Comparator.comparing(ValueReferenceGroup::entityType).thenComparing(ValueReferenceGroup::fieldName));
        groups.forEach(g -> g.items().sort(Comparator.comparing(ValueReference::entityLabel, String.CASE_INSENSITIVE_ORDER)));
        return new ValueReferenceReport(valueId, total, groups);
    }

    /**
     * Reference count for EVERY value in one pass, as {@code {valueId: count}}.
     *
     * <p>Deliberately not "call {@link #findReferences} per value": that would be one query per
     * Value-typed attribute per value (~40 × N). This runs one GROUP BY per attribute — ~40 queries
     * total no matter how many values exist — because the aggregate needs no labels, only counts.
     * Values with no references are simply absent from the map.
     */
    @Transactional(readOnly = true)
    public Map<Long, Integer> referenceCounts() {
        Map<Long, Integer> counts = new LinkedHashMap<>();

        for (AttributeRef ref : valueAttributes()) {
            String entityName = ref.entityType().getName();
            List<?> rows;
            try {
                String jpql = ref.collection()
                        ? "SELECT v.id, COUNT(e) FROM " + entityName + " e JOIN e." + ref.fieldName() + " v GROUP BY v.id"
                        : "SELECT e." + ref.fieldName() + ".id, COUNT(e) FROM " + entityName + " e"
                          + " WHERE e." + ref.fieldName() + ".id IS NOT NULL GROUP BY e." + ref.fieldName() + ".id";
                rows = entityManager.createQuery(jpql).getResultList();
            } catch (Exception e) {
                log.warn("[ValueReference] Could not count {}.{}: {}", entityName, ref.fieldName(), e.getMessage());
                continue;
            }

            for (Object row : rows) {
                if (!(row instanceof Object[] pair) || pair.length < 2) continue;
                if (!(pair[0] instanceof Number valueId) || !(pair[1] instanceof Number count)) continue;
                counts.merge(valueId.longValue(), count.intValue(), Integer::sum);
            }
        }
        return counts;
    }

    /** Human label for an entity, falling back to a type#id stamp rather than failing the report. */
    private String safeLabel(String entityType, Long id) {
        try {
            String label = syncLabelService.labelFor(entityType, id);
            if (label != null && !label.isBlank()) return label;
        } catch (Exception e) {
            log.debug("[ValueReference] No label for {} {}: {}", entityType, id, e.getMessage());
        }
        return entityType + " #" + id;
    }

    /**
     * Move every reference from one Value to another.
     *
     * <p>Entities are mutated one at a time through the persistence context so the field-change
     * listener emits per-row updates — a bulk JPQL update would be faster and would silently skip
     * the sync log. Returns the number of rows repointed.
     */
    @Transactional
    public int repoint(Long fromValueId, Long toValueId) {
        if (fromValueId == null || toValueId == null) {
            throw new IllegalArgumentException("Both source and target value ids are required");
        }
        if (fromValueId.equals(toValueId)) {
            throw new IllegalArgumentException("Source and target value must differ");
        }

        Value from = entityManager.find(Value.class, fromValueId);
        Value to = entityManager.find(Value.class, toValueId);
        if (from == null) throw new IllegalArgumentException("Value to repoint from was not found");
        if (to == null) throw new IllegalArgumentException("Target value was not found");

        int moved = 0;
        for (AttributeRef ref : valueAttributes()) {
            String entityName = ref.entityType().getName();
            List<?> hits;
            try {
                String jpql = ref.collection()
                        ? "SELECT e FROM " + entityName + " e JOIN e." + ref.fieldName() + " v WHERE v.id = :valueId"
                        : "SELECT e FROM " + entityName + " e WHERE e." + ref.fieldName() + ".id = :valueId";
                hits = entityManager.createQuery(jpql).setParameter("valueId", fromValueId).getResultList();
            } catch (Exception e) {
                log.warn("[ValueReference] Could not repoint {}.{}: {}", entityName, ref.fieldName(), e.getMessage());
                continue;
            }

            for (Object hit : hits) {
                try {
                    preserveDerivedIdentity(hit, from);
                    if (ref.collection()) {
                        Collection<Value> collection = readCollection(hit, ref.fieldName());
                        if (collection != null) {
                            collection.removeIf(v -> v != null && fromValueId.equals(v.getId()));
                            if (collection.stream().noneMatch(v -> v != null && toValueId.equals(v.getId()))) {
                                collection.add(to);
                            }
                            moved++;
                        }
                    } else {
                        writeField(hit, ref.fieldName(), to);
                        moved++;
                    }
                    remapSoftValueKeys(hit, fromValueId, toValueId);
                    entityManager.merge(hit);
                } catch (Exception e) {
                    log.warn("[ValueReference] Failed repointing {}.{} on id {}: {}",
                            entityName, ref.fieldName(), hit, e.getMessage());
                }
            }
        }
        entityManager.flush();
        log.info("[ValueReference] Repointed {} reference(s) from value {} to {}", moved, fromValueId, toValueId);
        return moved;
    }

    /**
     * Soft-delete a Value, but only once nothing references it.
     *
     * <p>Soft, not {@code deleteById}: every domain entity here uses the {@code deleted} flag +
     * {@code @Where} convention, and a hard delete would neither emit a sync change nor be
     * recoverable. The reference check is the gate the UI mirrors — it is enforced here too so the
     * endpoint is safe on its own.
     */
    @Transactional
    public void deleteIfUnreferenced(Long valueId) {
        ValueReferenceReport report = findReferences(valueId);
        if (report.totalCount() > 0) {
            throw new IllegalStateException(
                    "Value still has " + report.totalCount() + " reference(s); repoint them before deleting");
        }
        Value value = entityManager.find(Value.class, valueId);
        if (value == null) throw new IllegalArgumentException("Value not found");
        value.setDeleted(true);
        entityManager.merge(value);
        entityManager.flush();
        log.info("[ValueReference] Soft-deleted unreferenced value {} ({})", valueId, value.getName());
    }

    /**
     * Before a reference moves, pin down any identity that was only DERIVED from the value being
     * moved away from.
     *
     * <p>Concretely: a {@code FieldListItem} written before {@code workArea} existed carries its
     * work area only as the NAME of its Location Value — the PWA's "items in this area" strip
     * matches on that name. Re-pointing the Location Value therefore silently re-homed those items
     * (they vanished from their real area's list). Binding {@code workArea} from the OLD value's
     * name first makes the item's identity independent of the Location Value, so the re-point that
     * follows is lossless.
     *
     * <p>Only fills a gap — an item that already knows its work area is left untouched.
     */
    private void preserveDerivedIdentity(Object entity, Value from) {
        if (!(entity instanceof FieldListItem item) || item.getWorkArea() != null) return;
        if (from == null || from.getName() == null || from.getName().isBlank()) return;

        workAreaRepo.findFirstByNameIgnoreCase(from.getName()).ifPresent(workArea -> {
            item.setWorkArea(workArea);
            log.info("[ValueReference] Preserved FieldListItem {} work area '{}' before re-pointing location value {}",
                    item.getId(), workArea.getName(), from.getId());
        });
    }

    /**
     * Move "soft" references — Value ids stored inside JSON rather than as an FK, which the
     * metamodel scan cannot see.
     *
     * <p>{@code WorkArea.locationUnitFiltersJson} keys its per-location unit pins by location-Value
     * id. Repointing the {@code locations} membership alone would leave the pin keyed to the old id,
     * where the next save silently prunes it — losing the U1/U2 setting without a trace.
     *
     * <p>Kept as an explicit, narrow list on purpose: it is a real coupling that deserves to be
     * visible, and a generic JSON crawl would be guesswork.
     */
    private void remapSoftValueKeys(Object entity, Long fromValueId, Long toValueId) {
        if (!(entity instanceof com.dk_power.power_plant_java.entities.permits.WorkArea workArea)) return;

        Map<String, String> filters = workArea.getLocationUnitFilters();
        String pin = filters.get(String.valueOf(fromValueId));
        if (pin == null) return;

        Map<String, String> remapped = new LinkedHashMap<>(filters);
        remapped.remove(String.valueOf(fromValueId));
        remapped.putIfAbsent(String.valueOf(toValueId), pin);
        workArea.setLocationUnitFilters(remapped);
        log.info("[ValueReference] Moved WorkArea {} unit pin '{}' from location {} to {}",
                workArea.getId(), pin, fromValueId, toValueId);
    }

    @SuppressWarnings("unchecked")
    private Collection<Value> readCollection(Object target, String fieldName) throws Exception {
        Field field = findField(target.getClass(), fieldName);
        field.setAccessible(true);
        return (Collection<Value>) field.get(target);
    }

    private void writeField(Object target, String fieldName, Value newValue) throws Exception {
        Field field = findField(target.getClass(), fieldName);
        field.setAccessible(true);
        field.set(target, newValue);
    }

    /** Walk up the hierarchy — Value fields commonly sit on a mapped superclass. */
    private Field findField(Class<?> type, String fieldName) throws NoSuchFieldException {
        Class<?> current = type;
        while (current != null && current != Object.class) {
            try {
                return current.getDeclaredField(fieldName);
            } catch (NoSuchFieldException ignored) {
                current = current.getSuperclass();
            }
        }
        throw new NoSuchFieldException(fieldName + " not found on " + type.getName());
    }
}
