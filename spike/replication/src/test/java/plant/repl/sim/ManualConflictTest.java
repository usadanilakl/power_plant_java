package plant.repl.sim;

import org.junit.jupiter.api.Test;
import plant.repl.engine.Conflict;
import plant.repl.engine.Replica;
import plant.repl.model.LotoPoint;
import plant.repl.model.MergeRegistry;
import plant.repl.merge.MergeKind;

import java.util.EnumSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Same-field concurrent editing — confirmed to happen routinely here, with both edits
 * mattering (ADR-0004).
 *
 * <p>Two values cannot both occupy one field, so the choice is not "merge or lose" but
 * "lose silently or tell someone". For a LOTO point's isolation position, silent loss
 * is a safety problem, so the field declares {@link MergeKind#MANUAL}.
 */
class ManualConflictTest {

    private static final String TYPE = "LotoPoint";
    private static final String ID = "LP-1";

    private Simulator sim() {
        return new Simulator(MergeRegistry.of(LotoPoint.class));
    }

    @Test
    void concurrent_edits_to_a_safety_field_are_recorded_identically_on_every_replica() {
        Simulator sim = sim();
        Replica a = sim.node("A", 1_000);
        Replica b = sim.node("B", 1_000);

        a.set(TYPE, ID, "isolatedPosition", "CLOSED");
        sim.settle();

        sim.partition(Set.of("A"), Set.of("B"));
        a.set(TYPE, ID, "isolatedPosition", "LOCKED CLOSED");
        sim.clock("B").advance(50);
        b.set(TYPE, ID, "isolatedPosition", "OPEN — drained");

        sim.healAndSettle();

        // Convergence includes the conflict record itself. If two replicas disagreed
        // about what is in conflict, the system has not converged.
        sim.assertConverged();

        assertEquals(1, a.conflicts().size());
        Conflict conflict = a.conflicts().iterator().next();
        Set<String> competing = conflict.values();

        assertTrue(competing.contains("LOCKED CLOSED"), "A's edit must be preserved");
        assertTrue(competing.contains("OPEN — drained"), "B's edit must be preserved");
    }

    @Test
    void sequential_edits_are_not_conflicts() {
        Simulator sim = sim();
        Replica a = sim.node("A", 1_000);
        Replica b = sim.node("B", 1_000);

        a.set(TYPE, ID, "isolatedPosition", "CLOSED");
        sim.settle();
        b.set(TYPE, ID, "isolatedPosition", "LOCKED CLOSED");   // saw A's value first
        sim.settle();
        sim.assertConverged();

        assertEquals(0, a.conflicts().size(),
                "an edit that observed the current value is a normal update, not a conflict");
        assertEquals("LOCKED CLOSED", a.get(TYPE, ID, "isolatedPosition").value());
    }

    @Test
    void the_same_race_on_an_lww_field_loses_one_edit_silently() {
        Simulator sim = sim();
        Replica a = sim.node("A", 1_000);
        Replica b = sim.node("B", 1_000);

        a.set(TYPE, ID, "description", "start");
        sim.settle();

        sim.partition(Set.of("A"), Set.of("B"));
        a.set(TYPE, ID, "description", "A's rewrite");
        sim.clock("B").advance(50);
        b.set(TYPE, ID, "description", "B's rewrite");

        sim.healAndSettle();
        sim.assertConverged();

        // The deliberate contrast: same race, different declared policy. The engine
        // detects the disagreement either way — what differs is whether anyone is told.
        // For a description one value simply wins; for an isolation position a person
        // must decide. That is why policy is declared per field.
        assertEquals("B's rewrite", a.get(TYPE, ID, "description").value());
    }

    @Test
    void every_declared_merge_kind_has_simulator_coverage() {
        Set<MergeKind> declared = MergeRegistry.of(LotoPoint.class).declaredKinds();
        Set<MergeKind> covered = EnumSet.of(MergeKind.LWW, MergeKind.ORSET, MergeKind.MANUAL);

        assertEquals(covered, declared,
                "A merge kind with no simulator case must not exist — add a test or remove the kind");
    }
}
