package plant.repl.sim;

import org.junit.jupiter.api.Test;
import plant.repl.engine.Replica;
import plant.repl.model.LotoPoint;
import plant.repl.model.MergeRegistry;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * The defect class this whole design change exists for.
 *
 * <p>The current system orders changes by {@code FieldChange.timestamp}, a raw
 * {@code Instant}, with no logical clock anywhere in the codebase. That is only
 * correct while every machine's wall clock agrees — and desktops here run partitioned
 * for long periods, which is exactly when clocks drift furthest. When they disagree,
 * the wrong write wins silently: no error, no conflict record, no trace.
 *
 * <p>Each test below fails under wall-clock ordering and passes under HLC.
 */
class ClockSkewTest {

    private static final String TYPE = "LotoPoint";
    private static final String ID = "LP-1";

    private Simulator sim() {
        return new Simulator(MergeRegistry.of(LotoPoint.class));
    }

    @Test
    void a_later_edit_from_a_slow_clocked_replica_is_not_lost() {
        Simulator sim = sim();
        Replica a = sim.node("A", 1_000_000);   // correct clock
        Replica b = sim.node("B",   400_000);   // ten minutes behind

        a.set(TYPE, ID, "description", "first, from A");
        sim.settle();

        // B now edits, having seen A's write. This is causally later.
        b.set(TYPE, ID, "description", "second, from B");
        sim.settle();
        sim.assertConverged();

        // Wall-clock ordering would compare 400_000 against 1_000_000 and keep A's
        // value, discarding a strictly later edit. Observing A's stamp advanced B's
        // hybrid clock past it, so causality survives the skew.
        assertEquals("second, from B", a.get(TYPE, ID, "description").value());
        assertEquals("second, from B", b.get(TYPE, ID, "description").value());
    }

    @Test
    void a_clock_jumping_backwards_cannot_reorder_causally_later_writes() {
        Simulator sim = sim();
        Replica a = sim.node("A", 5_000_000);
        Replica b = sim.node("B", 5_000_000);

        a.set(TYPE, ID, "description", "before the correction");
        sim.settle();

        // NTP correction, or a restart with a bad clock: time moves backwards.
        sim.clock("A").jumpTo(2_000_000);
        a.set(TYPE, ID, "description", "after the correction");
        sim.settle();
        sim.assertConverged();

        assertEquals("after the correction", b.get(TYPE, ID, "description").value());
    }

    @Test
    void replicas_drifting_apart_during_a_long_partition_still_converge() {
        Simulator sim = sim();
        Replica a = sim.node("A", 1_000_000);
        Replica b = sim.node("B", 1_000_000);

        sim.partition(Set.of("A"), Set.of("B"));

        // A week of divergence, with the clocks drifting in opposite directions.
        sim.clock("A").advance(604_800_000L);
        sim.clock("B").jumpTo(900_000);

        a.set(TYPE, ID, "unit", "01");
        b.set(TYPE, ID, "tagNumber", "LP-01-042");
        b.add(TYPE, ID, "equipmentIds", "EQ-9");

        sim.healAndSettle();
        sim.assertConverged();

        // Independent fields never contend, whatever the clocks said.
        assertEquals("01", b.get(TYPE, ID, "unit").value());
        assertEquals("LP-01-042", a.get(TYPE, ID, "tagNumber").value());
        assertEquals(Set.of("EQ-9"), a.elements(TYPE, ID, "equipmentIds"));
    }
}
