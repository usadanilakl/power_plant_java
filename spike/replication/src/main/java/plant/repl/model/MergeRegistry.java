package plant.repl.model;

import plant.repl.merge.Merge;
import plant.repl.merge.MergeKind;

import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;

/**
 * Reads {@link Merge} declarations off model classes into a lookup the engine uses.
 *
 * <p>This is the piece that keeps the engine generic. Adding an entity costs
 * annotations, not engine code — the hypothesis ADR-0007 rests on.
 *
 * <p><b>Fails loud.</b> A field with no declared policy throws rather than defaulting
 * to last-writer-wins. Silent defaults are how the current system ended up with
 * whole-value LWW on collection fields, quietly discarding concurrent additions. An
 * undeclared field is a modelling omission and should stop the build, not ship.
 */
public final class MergeRegistry {

    private final Map<String, Map<String, MergeKind>> byType = new TreeMap<>();

    private MergeRegistry() {
    }

    public static MergeRegistry of(Class<?>... models) {
        MergeRegistry registry = new MergeRegistry();
        for (Class<?> model : models) {
            Map<String, MergeKind> fields = new TreeMap<>();
            for (Field field : model.getDeclaredFields()) {
                Merge merge = field.getAnnotation(Merge.class);
                if (merge != null) fields.put(field.getName(), merge.value());
            }
            registry.byType.put(model.getSimpleName(), fields);
        }
        return registry;
    }

    public MergeKind kindOf(String entityType, String field) {
        Map<String, MergeKind> fields = byType.get(entityType);
        if (fields == null) {
            throw new IllegalStateException(
                    "No merge policy registered for entity type '" + entityType + "'");
        }
        MergeKind kind = fields.get(field);
        if (kind == null) {
            throw new IllegalStateException(
                    "Field '" + entityType + "." + field + "' declares no @Merge policy. "
                    + "Declare one explicitly — there is deliberately no default.");
        }
        return kind;
    }

    /** Every declared kind, so the test suite can assert each has simulator coverage. */
    public Set<MergeKind> declaredKinds() {
        Set<MergeKind> kinds = new TreeSet<>();
        byType.values().forEach(fields -> kinds.addAll(fields.values()));
        return kinds;
    }

    public Map<String, MergeKind> fieldsOf(String entityType) {
        return new HashMap<>(byType.getOrDefault(entityType, Map.of()));
    }
}
