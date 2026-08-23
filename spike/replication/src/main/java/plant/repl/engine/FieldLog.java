package plant.repl.engine;

import plant.repl.clock.Hlc;
import plant.repl.oplog.Operation;

import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;

/**
 * Every SET operation ever seen for one field, and the answers derived from them.
 *
 * <p>The important property: **nothing here is computed at apply time.** Operations are
 * collected; value and contention are worked out by looking at the whole set. Two replicas
 * holding the same operations therefore agree, no matter what order they arrived in.
 *
 * <p>The earlier design decided "is this concurrent?" as each operation landed, by comparing it
 * against whatever the replica currently held. That made the answer depend on arrival order —
 * one node's two sequential edits, delivered backwards, manufactured a conflict that had never
 * existed, and since conflicts are part of the state, the replicas then disagreed permanently.
 */
public final class FieldLog {

    /** stamp → the operation that carries it */
    private final Map<Hlc, Operation> ops = new TreeMap<>();

    public void add(Operation op) {
        ops.put(op.hlc(), op);
    }

    public boolean isEmpty() {
        return ops.isEmpty();
    }

    /**
     * The operations nothing else was written on top of.
     *
     * <p>One leaf means everyone agreed — writes happened in turn, each seeing the last. More
     * than one means people wrote independently, and that is a conflict whether or not the
     * stamps happen to order neatly.
     */
    public Set<Operation> leaves() {
        Set<Hlc> superseded = new HashSet<>();
        for (Operation op : ops.values()) {
            superseded.addAll(op.parents());
        }
        Set<Operation> leaves = new TreeSet<>((a, b) -> a.hlc().compareTo(b.hlc()));
        for (Map.Entry<Hlc, Operation> e : ops.entrySet()) {
            if (!superseded.contains(e.getKey())) leaves.add(e.getValue());
        }
        return leaves;
    }

    /** Every stamp currently visible — what the next write here records as having observed. */
    public Set<Hlc> frontier() {
        Set<Hlc> frontier = new TreeSet<>();
        for (Operation op : leaves()) frontier.add(op.hlc());
        return frontier;
    }

    public boolean isContested() {
        return leaves().size() > 1;
    }

    /**
     * The value shown. With one leaf it is that leaf. With several — a genuine disagreement —
     * the highest stamp is shown as a provisional answer, and {@link #isContested()} is true so
     * that no caller can mistake it for settled.
     */
    public String value() {
        Operation winner = null;
        for (Operation op : leaves()) {
            if (winner == null || op.hlc().isAfter(winner.hlc())) winner = op;
        }
        return winner == null ? null : winner.value();
    }

    /** All competing values, for showing a person what they must choose between. */
    public Set<String> competingValues() {
        Set<String> values = new TreeSet<>();
        for (Operation op : leaves()) values.add(String.valueOf(op.value()));
        return values;
    }

    @Override
    public String toString() {
        return isContested() ? "CONTESTED" + competingValues() : String.valueOf(value());
    }
}
