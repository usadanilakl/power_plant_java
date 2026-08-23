package plant.repl.sim;

import org.junit.jupiter.api.Test;
import plant.repl.engine.Replica;
import plant.repl.model.LotoPoint;
import plant.repl.model.MergeRegistry;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Collections.
 *
 * <p>The current model stores these as comma-separated strings ({@code equipmentIds},
 * {@code fileIds}) under whole-value last-writer-wins. Two replicas each adding a
 * different member while partitioned produce two different strings, one of which wins
 * outright — so one person's additions vanish with no indication anything was lost.
 *
 * <p>Declaring the field {@code ORSET} removes the failure mode rather than making it
 * less likely.
 */
class OrSetTest {

    private static final String TYPE = "LotoPoint";
    private static final String ID = "LP-1";

    private Simulator sim() {
        return new Simulator(MergeRegistry.of(LotoPoint.class));
    }

    @Test
    void concurrent_additions_on_both_sides_all_survive() {
        Simulator sim = sim();
        Replica a = sim.node("A", 1_000);
        Replica b = sim.node("B", 1_000);

        a.add(TYPE, ID, "equipmentIds", "EQ-1");
        sim.settle();

        sim.partition(Set.of("A"), Set.of("B"));
        a.add(TYPE, ID, "equipmentIds", "EQ-2");
        b.add(TYPE, ID, "equipmentIds", "EQ-3");

        sim.healAndSettle();
        sim.assertConverged();

        // Under the current comma-separated-string model this would be either
        // {EQ-1, EQ-2} or {EQ-1, EQ-3} — never both.
        assertEquals(Set.of("EQ-1", "EQ-2", "EQ-3"), a.elements(TYPE, ID, "equipmentIds"));
    }

    @Test
    void concurrent_add_and_remove_of_the_same_element_resolves_add_wins() {
        Simulator sim = sim();
        Replica a = sim.node("A", 1_000);
        Replica b = sim.node("B", 1_000);

        a.add(TYPE, ID, "equipmentIds", "EQ-1");
        sim.settle();

        sim.partition(Set.of("A"), Set.of("B"));
        a.remove(TYPE, ID, "equipmentIds", "EQ-1");   // removes the tag it can see
        b.add(TYPE, ID, "equipmentIds", "EQ-1");      // adds a tag A never saw

        sim.healAndSettle();
        sim.assertConverged();

        assertTrue(a.elements(TYPE, ID, "equipmentIds").contains("EQ-1"),
                "a concurrent re-add must survive a remove that never observed it");
    }

    @Test
    void a_remove_that_observed_every_tag_actually_removes() {
        Simulator sim = sim();
        Replica a = sim.node("A", 1_000);
        Replica b = sim.node("B", 1_000);

        a.add(TYPE, ID, "equipmentIds", "EQ-1");
        b.add(TYPE, ID, "equipmentIds", "EQ-1");   // same element, second tag
        sim.settle();

        a.remove(TYPE, ID, "equipmentIds", "EQ-1"); // now observes both tags
        sim.settle();
        sim.assertConverged();

        assertEquals(Set.of(), a.elements(TYPE, ID, "equipmentIds"));
        assertEquals(Set.of(), b.elements(TYPE, ID, "equipmentIds"));
    }

    @Test
    void removes_delivered_before_their_adds_still_converge() {
        Simulator sim = sim();
        Replica a = sim.node("A", 1_000);
        Replica b = sim.node("B", 1_000);
        Replica c = sim.node("C", 1_000);

        a.add(TYPE, ID, "lotoStandardIds", "LS-1");
        sim.settle();
        a.remove(TYPE, ID, "lotoStandardIds", "LS-1");

        // C receives the remove first, then the add. Delivery order is not causal order.
        c.receiveAll(a.log().reversed());

        sim.healAndSettle();
        sim.assertConverged();
        assertEquals(Set.of(), c.elements(TYPE, ID, "lotoStandardIds"));
    }
}
