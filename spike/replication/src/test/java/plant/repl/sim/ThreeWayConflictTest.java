package plant.repl.sim;

import org.junit.jupiter.api.Test;
import plant.repl.engine.Conflict;
import plant.repl.engine.Replica;
import plant.repl.model.LotoPoint;
import plant.repl.model.MergeRegistry;
import plant.repl.oplog.Operation;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Gap found while reviewing: ManualConflictTest only exercises TWO concurrent writers.
 * The conflict record is built from (current, incoming) at detection time, and current
 * changes as operations arrive — so with three or more concurrent writers, convergence
 * of the conflict set is a claim, not an obvious fact.
 */
class ThreeWayConflictTest {

    private static final String TYPE = "LotoPoint";
    private static final String ID = "LP-1";

    @Test
    void three_concurrent_writers_produce_the_same_conflict_on_every_replica() {
        Simulator sim = new Simulator(MergeRegistry.of(LotoPoint.class));
        Replica a = sim.node("A", 1_000);
        Replica b = sim.node("B", 1_000);
        Replica c = sim.node("C", 1_000);

        sim.partition(Set.of("A"), Set.of("B"), Set.of("C"));
        a.set(TYPE, ID, "isolatedPosition", "CLOSED");
        sim.clock("B").advance(10);
        b.set(TYPE, ID, "isolatedPosition", "OPEN");
        sim.clock("C").advance(20);
        c.set(TYPE, ID, "isolatedPosition", "LOCKED OPEN");

        sim.healAndSettle();
        sim.assertConverged();

        Set<String> competing = a.conflicts().iterator().next().values();
        assertEquals(Set.of("CLOSED", "OPEN", "LOCKED OPEN"), competing,
                "all three independent edits must be preserved");
    }

    @Test
    void conflict_is_independent_of_the_order_operations_arrive_in() {
        MergeRegistry registry = MergeRegistry.of(LotoPoint.class);

        // Three concurrent writes, produced once.
        Simulator source = new Simulator(registry);
        Replica a = source.node("A", 1_000);
        Replica b = source.node("B", 1_000);
        Replica c = source.node("C", 1_000);
        source.partition(Set.of("A"), Set.of("B"), Set.of("C"));
        a.set(TYPE, ID, "isolatedPosition", "CLOSED");
        source.clock("B").advance(10);
        b.set(TYPE, ID, "isolatedPosition", "OPEN");
        source.clock("C").advance(20);
        c.set(TYPE, ID, "isolatedPosition", "LOCKED OPEN");

        List<Operation> ops = new ArrayList<>();
        ops.addAll(a.log());
        ops.addAll(b.log());
        ops.addAll(c.log());

        // Replay every permutation into a fresh replica; all must agree.
        String reference = null;
        for (List<Operation> order : permutations(ops)) {
            Replica fresh = new Replica("X", registry, new TestClock(1_000));
            fresh.receiveAll(order);
            if (reference == null) reference = fresh.snapshot();
            else assertEquals(reference, fresh.snapshot(),
                    "delivery order changed the result:\n" + order);
        }
    }

    private static List<List<Operation>> permutations(List<Operation> items) {
        List<List<Operation>> out = new ArrayList<>();
        permute(new ArrayList<>(items), 0, out);
        return out;
    }

    private static void permute(List<Operation> items, int k, List<List<Operation>> out) {
        if (k == items.size()) { out.add(new ArrayList<>(items)); return; }
        for (int i = k; i < items.size(); i++) {
            java.util.Collections.swap(items, k, i);
            permute(items, k + 1, out);
            java.util.Collections.swap(items, k, i);
        }
    }
}
