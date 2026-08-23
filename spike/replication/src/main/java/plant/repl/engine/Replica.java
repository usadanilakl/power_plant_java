package plant.repl.engine;

import plant.repl.clock.Hlc;
import plant.repl.clock.HybridLogicalClock;
import plant.repl.merge.MergeKind;
import plant.repl.model.MergeRegistry;
import plant.repl.oplog.Operation;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.function.LongSupplier;
import java.util.function.Predicate;

/**
 * One replicating node — a desktop or the hub.
 *
 * <p>Collects operations; derives state from them. Nothing is decided as an operation lands,
 * which is what makes two replicas holding the same operations agree regardless of the order
 * or the route they arrived by.
 */
public final class Replica {

    private final String nodeId;
    private final HybridLogicalClock clock;
    private final MergeRegistry registry;

    private final List<Operation> log = new ArrayList<>();
    private final Set<String> appliedOpIds = new HashSet<>();
    private final List<Operation> refused = new ArrayList<>();
    private final List<Operation> quarantined = new ArrayList<>();

    private final Map<String, FieldLog> scalars = new TreeMap<>();
    private final Map<String, OrSetField> sets = new TreeMap<>();

    /** Conditions a caller can attach to an operation, by name. */
    private final Map<String, Predicate<Replica>> conditions = new TreeMap<>();

    public Replica(String nodeId, MergeRegistry registry, LongSupplier physicalTimeMillis) {
        this.nodeId = nodeId;
        this.registry = registry;
        this.clock = new HybridLogicalClock(nodeId, physicalTimeMillis);
    }

    /** Register a named condition, e.g. "nobody-signed-on". */
    public void defineCondition(String name, Predicate<Replica> test) {
        conditions.put(name, test);
    }

    // ---------------------------------------------------------------- local edits

    public void set(String type, String id, String field, String value) {
        set(type, id, field, value, null);
    }

    /** Set a value, optionally only if a named condition still holds when applied. */
    public void set(String type, String id, String field, String value, String condition) {
        requireKind(type, field, MergeKind.LWW, MergeKind.MANUAL);
        Hlc stamp = clock.tick();
        Set<Hlc> observed = fieldLog(key(type, id, field)).frontier();
        record(Operation.set(clock.nextSeq(), type, id, field, value, observed, condition, stamp));
    }

    public void add(String type, String id, String field, String element) {
        requireKind(type, field, MergeKind.ORSET);
        Hlc stamp = clock.tick();
        record(Operation.add(clock.nextSeq(), type, id, field, element, stamp));
    }

    public void remove(String type, String id, String field, String element) {
        requireKind(type, field, MergeKind.ORSET);
        Hlc stamp = clock.tick();
        Set<String> seen = orSet(key(type, id, field)).observedTags(element);
        record(Operation.remove(clock.nextSeq(), type, id, field, element, seen, stamp));
    }

    // ------------------------------------------------------------------- receive

    public void receive(Operation op) {
        if (appliedOpIds.contains(op.opId())) return;
        if (!clock.observe(op.hlc())) {
            quarantined.add(op);      // stamp implausibly far ahead — held, not discarded
            return;
        }
        record(op);
    }

    public void receiveAll(Collection<Operation> ops) {
        ops.forEach(this::receive);
        retryQuarantined();
    }

    /**
     * Reconsider held operations. A stamp that looked implausible may become acceptable once
     * local time advances, or once other operations move this clock forward. Holding rather
     * than discarding is what keeps a wrong local clock from destroying a colleague's work.
     */
    public void retryQuarantined() {
        if (quarantined.isEmpty()) return;
        List<Operation> held = new ArrayList<>(quarantined);
        quarantined.clear();
        for (Operation op : held) {
            if (appliedOpIds.contains(op.opId())) continue;
            if (clock.observe(op.hlc())) record(op);
            else quarantined.add(op);
        }
    }

    // -------------------------------------------------------------------- engine

    private void record(Operation op) {
        if (!appliedOpIds.add(op.opId())) return;

        if (op.condition() != null) {
            Predicate<Replica> test = conditions.get(op.condition());
            if (test != null && !test.test(this)) {
                refused.add(op);      // the condition it depended on no longer holds
                return;
            }
        }

        log.add(op);
        switch (op.kind()) {
            case SET -> fieldLog(op.fieldKey()).add(op);
            case ADD -> orSet(op.fieldKey()).add(op.value(), op.opId());
            case REMOVE -> orSet(op.fieldKey()).remove(op.value(), op.seenTags());
        }
    }

    private FieldLog fieldLog(String fieldKey) {
        return scalars.computeIfAbsent(fieldKey, k -> new FieldLog());
    }

    private OrSetField orSet(String fieldKey) {
        return sets.computeIfAbsent(fieldKey, k -> new OrSetField());
    }

    private static String key(String type, String id, String field) {
        return type + "#" + id + "." + field;
    }

    private void requireKind(String type, String field, MergeKind... allowed) {
        MergeKind actual = registry.kindOf(type, field);
        for (MergeKind kind : allowed) if (kind == actual) return;
        throw new IllegalArgumentException(
                type + "." + field + " is " + actual + "; that operation is not valid for it");
    }

    // --------------------------------------------------------------- inspection

    public String nodeId() {
        return nodeId;
    }

    public List<Operation> log() {
        return List.copyOf(log);
    }

    /** Operations refused because the condition they carried no longer held. */
    public List<Operation> refused() {
        return List.copyOf(refused);
    }

    /** Operations held because their stamp is implausibly far ahead. Not lost — reconsidered. */
    public List<Operation> quarantined() {
        return List.copyOf(quarantined);
    }

    /** A field's value, and whether it can be acted on. Never a bare string. */
    public FieldValue get(String type, String id, String field) {
        FieldLog f = scalars.get(key(type, id, field));
        if (f == null || f.isEmpty()) return FieldValue.ABSENT;
        return new FieldValue(f.value(), f.isContested(), f.competingValues());
    }

    public Set<String> elements(String type, String id, String field) {
        return orSet(key(type, id, field)).elements();
    }

    public List<Conflict> conflicts() {
        List<Conflict> out = new ArrayList<>();
        scalars.forEach((fieldKey, f) -> {
            if (f.isContested()) {
                int dot = fieldKey.lastIndexOf('.');
                out.add(new Conflict(fieldKey.substring(0, dot), fieldKey.substring(dot + 1),
                        f.competingValues()));
            }
        });
        return out;
    }

    /** Contiguous-sequence gaps per node — what this replica knows it is missing. */
    public Map<String, List<Long>> gaps() {
        Map<String, Set<Long>> byNode = new TreeMap<>();
        for (Operation op : log) {
            byNode.computeIfAbsent(op.nodeId(), k -> new java.util.TreeSet<>()).add(op.seq());
        }
        Map<String, List<Long>> gaps = new TreeMap<>();
        byNode.forEach((node, seqs) -> {
            List<Long> missing = new ArrayList<>();
            long max = seqs.stream().mapToLong(Long::longValue).max().orElse(0);
            for (long i = 1; i <= max; i++) if (!seqs.contains(i)) missing.add(i);
            if (!missing.isEmpty()) gaps.put(node, missing);
        });
        return gaps;
    }

    /** Canonical rendering. Two converged replicas produce identical text. */
    public String snapshot() {
        StringBuilder sb = new StringBuilder();
        scalars.forEach((fieldKey, f) -> sb.append(fieldKey).append(" = ").append(f).append('\n'));
        sets.forEach((fieldKey, s) -> sb.append(fieldKey).append(" = ").append(s.elements()).append('\n'));
        return sb.toString();
    }
}
