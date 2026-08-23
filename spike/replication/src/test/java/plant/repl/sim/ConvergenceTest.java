package plant.repl.sim;

import org.junit.jupiter.api.Test;
import plant.repl.engine.Replica;
import plant.repl.model.LotoPoint;
import plant.repl.model.MergeRegistry;
import plant.repl.oplog.Operation;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;

/** Baseline: replicas that see the same operations agree, whatever the route or order. */
class ConvergenceTest {

    private static final String TYPE = "LotoPoint";
    private static final String ID = "LP-1";

    private Simulator sim() {
        return new Simulator(MergeRegistry.of(LotoPoint.class));
    }

    @Test
    void edits_to_different_fields_during_a_partition_all_survive() {
        Simulator sim = sim();
        Replica a = sim.node("A", 1_000);
        Replica b = sim.node("B", 1_000);

        a.set(TYPE, ID, "description", "valve upstream");
        sim.settle();
        sim.assertConverged();

        sim.partition(Set.of("A"), Set.of("B"));
        a.set(TYPE, ID, "description", "valve upstream of pump");
        sim.clock("B").advance(5_000);
        b.set(TYPE, ID, "specificLocation", "Unit 1 basement");

        sim.healAndSettle();
        sim.assertConverged();

        assertEquals("valve upstream of pump", a.get(TYPE, ID, "description").value());
        assertEquals("Unit 1 basement", a.get(TYPE, ID, "specificLocation").value());
    }

    @Test
    void a_replica_receiving_operations_in_reverse_order_reaches_the_same_state() {
        Simulator sim = sim();
        Replica a = sim.node("A", 1_000);
        Replica b = sim.node("B", 1_000);
        Replica c = sim.node("C", 1_000);

        sim.partition(Set.of("A"), Set.of("B"), Set.of("C"));
        a.set(TYPE, ID, "description", "from A");
        sim.clock("B").advance(10);
        b.set(TYPE, ID, "unit", "01");
        sim.clock("A").advance(20);
        a.set(TYPE, ID, "tagNumber", "LP-01-001");

        // Deliver everything to C backwards. Order must not matter.
        List<Operation> everything = new ArrayList<>();
        everything.addAll(a.log());
        everything.addAll(b.log());
        java.util.Collections.reverse(everything);
        c.receiveAll(everything);

        sim.healAndSettle();
        sim.assertConverged();
    }

    @Test
    void redelivering_the_same_operations_changes_nothing() {
        Simulator sim = sim();
        Replica a = sim.node("A", 1_000);
        Replica b = sim.node("B", 1_000);

        a.set(TYPE, ID, "description", "once");
        a.add(TYPE, ID, "equipmentIds", "EQ-1");
        sim.settle();

        String before = b.snapshot();
        b.receiveAll(a.log());
        b.receiveAll(a.log());
        b.receiveAll(a.log());

        assertEquals(before, b.snapshot(), "apply must be idempotent");
    }

    @Test
    void a_three_way_partition_converges_once_healed() {
        Simulator sim = sim();
        Replica a = sim.node("A", 1_000);
        Replica b = sim.node("B", 1_000);
        Replica c = sim.node("C", 1_000);

        sim.partition(Set.of("A"), Set.of("B"), Set.of("C"));
        a.set(TYPE, ID, "description", "A saw this");
        b.add(TYPE, ID, "equipmentIds", "EQ-B");
        c.add(TYPE, ID, "lotoStandardIds", "LS-C");

        // Partial heal first: A and B reconnect, C is still alone.
        sim.partition(Set.of("A", "B"), Set.of("C"));
        sim.settle();

        sim.healAndSettle();
        sim.assertConverged();

        assertEquals(Set.of("EQ-B"), a.elements(TYPE, ID, "equipmentIds"));
        assertEquals(Set.of("LS-C"), a.elements(TYPE, ID, "lotoStandardIds"));
    }
}
