package plant.repl.sim;

import org.junit.jupiter.api.Test;
import plant.repl.engine.Replica;
import plant.repl.model.LotoPoint;
import plant.repl.model.MergeRegistry;

import plant.repl.engine.FieldValue;

import static org.junit.jupiter.api.Assertions.*;

/** Verifying defects reported by adversarial review. Each should FAIL if the defect is real. */
class ReportedDefectsTest {

    private static final String TYPE = "LotoPoint";
    private static final String ID = "LP-1";
    private final MergeRegistry registry = MergeRegistry.of(LotoPoint.class);

    /** DEFECT 2: basedOn compared against the local current stamp is arrival-order dependent. */
    @Test
    void one_writers_sequential_edits_delivered_out_of_order_must_not_conflict() {
        Replica a = new Replica("A", registry, new TestClock(1_000));
        a.set(TYPE, ID, "isolatedPosition", "CLOSED");
        a.set(TYPE, ID, "isolatedPosition", "LOCKED CLOSED");

        assertEquals(0, a.conflicts().size(), "author sees no conflict — there is none");

        Replica c = new Replica("C", registry, new TestClock(1_000));
        c.receiveAll(a.log().reversed());          // same two ops, reverse arrival

        assertEquals(0, c.conflicts().size(),
                "no concurrency exists anywhere; a receiver must not invent a conflict");
        assertEquals(a.snapshot(), c.snapshot(),
                "arrival order must not change state — this is permanent divergence");
    }

    /** DEFECT 3: opId is an in-memory counter the clock does not persist. */
    @Test
    void a_restarted_node_does_not_remint_operation_ids() {
        Replica peer = new Replica("PEER", registry, new TestClock(1_000));

        Replica before = new Replica("B", registry, new TestClock(1_000));
        before.set(TYPE, ID, "description", "written before restart");
        peer.receiveAll(before.log());

        // Restart: same node id, fresh process. Clock state would be restored; opCounter is not.
        Replica after = new Replica("B", registry, new TestClock(2_000));
        after.set(TYPE, ID, "description", "written after restart");
        peer.receiveAll(after.log());

        assertEquals("written after restart", peer.get(TYPE, ID, "description").value(),
                "post-restart write was silently discarded as a duplicate opId");
    }

    /** DEFECT 3b: add-tags are opIds, so OR-Set membership aliases across a restart too. */
    @Test
    void or_set_tags_do_not_alias_across_a_restart() {
        Replica peer = new Replica("PEER", registry, new TestClock(1_000));

        Replica before = new Replica("B", registry, new TestClock(1_000));
        before.add(TYPE, ID, "equipmentIds", "EQ-1");
        peer.receiveAll(before.log());

        Replica after = new Replica("B", registry, new TestClock(2_000));
        after.add(TYPE, ID, "equipmentIds", "EQ-2");
        peer.receiveAll(after.log());

        assertEquals(java.util.Set.of("EQ-1", "EQ-2"), peer.elements(TYPE, ID, "equipmentIds"),
                "second add was discarded — its tag collided with the pre-restart tag");
    }

    /** DEFECT 5: a contested field must not read as settled. */
    @Test
    void a_contested_safety_field_does_not_read_as_settled() {
        Replica a = new Replica("A", registry, new TestClock(1_000));
        Replica b = new Replica("B", registry, new TestClock(1_000));

        a.set(TYPE, ID, "isolatedPosition", "CLOSED");
        b.receiveAll(a.log());

        // Partitioned concurrent edits to a safety field.
        a.set(TYPE, ID, "isolatedPosition", "LOCKED CLOSED");
        b.set(TYPE, ID, "isolatedPosition", "OPEN - drained");
        a.receiveAll(b.log());
        b.receiveAll(a.log());

        FieldValue shown = a.get(TYPE, ID, "isolatedPosition");

        assertTrue(shown.contested(), "the field is disputed and must say so");
        assertTrue(shown.needsPerson(), "a caller cannot act on this without a person");
        assertEquals(java.util.Set.of("LOCKED CLOSED", "OPEN - drained"), shown.competing(),
                "both edits must be visible to whoever resolves it");
        assertEquals(a.snapshot(), b.snapshot(), "and both replicas agree it is disputed");
    }
}
