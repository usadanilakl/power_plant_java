package plant.repl.sim;

import org.junit.jupiter.api.Test;
import plant.repl.engine.FieldValue;
import plant.repl.engine.Replica;
import plant.repl.model.LotoPoint;
import plant.repl.model.MergeRegistry;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Resolving a conflict must actually clear it.
 *
 * <p>This is the case that separates recording the whole visible frontier from recording only
 * the current winner. While one leaf exists the two are identical — which is why every other
 * test passes under either. The difference appears the moment a person writes a decision on top
 * of a disagreement: a write that observed only the winner leaves the loser dangling, and the
 * field stays contested forever with no way to settle it.
 */
class ResolutionTest {

    private static final String TYPE = "LotoPoint";
    private static final String ID = "LP-1";
    private final MergeRegistry registry = MergeRegistry.of(LotoPoint.class);

    @Test
    void a_person_writing_a_decision_clears_the_conflict() {
        Simulator sim = new Simulator(registry);
        Replica a = sim.node("A", 1_000);
        Replica b = sim.node("B", 1_000);

        a.set(TYPE, ID, "isolatedPosition", "CLOSED");
        sim.settle();

        sim.partition(Set.of("A"), Set.of("B"));
        a.set(TYPE, ID, "isolatedPosition", "LOCKED CLOSED");
        sim.clock("B").advance(50);
        b.set(TYPE, ID, "isolatedPosition", "OPEN - drained");
        sim.healAndSettle();

        assertTrue(a.get(TYPE, ID, "isolatedPosition").contested(), "precondition: disputed");

        // A person looks at both and decides. This write observes everything on screen.
        a.set(TYPE, ID, "isolatedPosition", "LOCKED CLOSED - confirmed by walkdown");
        sim.settle();

        FieldValue after = a.get(TYPE, ID, "isolatedPosition");
        assertFalse(after.contested(), "the decision must settle it, not add a third opinion");
        assertEquals("LOCKED CLOSED - confirmed by walkdown", after.value());
        assertEquals(0, a.conflicts().size());
        sim.assertConverged();
    }

    @Test
    void a_decision_made_on_one_replica_settles_it_on_every_replica() {
        Simulator sim = new Simulator(registry);
        Replica a = sim.node("A", 1_000);
        Replica b = sim.node("B", 1_000);
        Replica c = sim.node("C", 1_000);

        a.set(TYPE, ID, "isolatedPosition", "CLOSED");
        sim.settle();

        sim.partition(Set.of("A"), Set.of("B"), Set.of("C"));
        a.set(TYPE, ID, "isolatedPosition", "OPEN");
        sim.clock("B").advance(10);
        b.set(TYPE, ID, "isolatedPosition", "LOCKED OPEN");
        sim.healAndSettle();

        assertTrue(c.get(TYPE, ID, "isolatedPosition").contested());

        // C is where the supervisor happens to be standing.
        c.set(TYPE, ID, "isolatedPosition", "OPEN - agreed");
        sim.settle();

        for (String id : new String[]{"A", "B", "C"}) {
            assertFalse(sim.node(id).get(TYPE, ID, "isolatedPosition").contested(),
                    id + " still shows the field as disputed after it was settled");
        }
        sim.assertConverged();
    }
}
