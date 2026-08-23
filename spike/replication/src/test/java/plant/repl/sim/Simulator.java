package plant.repl.sim;

import plant.repl.engine.Replica;
import plant.repl.model.MergeRegistry;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.fail;

/**
 * A partitionable network of replicas.
 *
 * <p>Built before the engine was trusted, which is the order ADR-0007 requires: a
 * merge rule with no simulator case does not exist. The current system has no
 * equivalent, which is why its divergence defects were found in production rather
 * than in a test.
 *
 * <p>Usage is deliberately blunt:
 * <pre>
 *   sim.partition(Set.of("A"), Set.of("B"));   // split
 *   ... edits on each side ...
 *   sim.heal();
 *   sim.settle();
 *   sim.assertConverged();
 * </pre>
 */
public final class Simulator {

    private final MergeRegistry registry;
    private final Map<String, Replica> replicas = new LinkedHashMap<>();
    private final Map<String, TestClock> clocks = new LinkedHashMap<>();
    private List<Set<String>> groups = new ArrayList<>();

    public Simulator(MergeRegistry registry) {
        this.registry = registry;
    }

    /** Add a node whose physical clock starts at the given time. */
    public Replica node(String id, long clockStartMillis) {
        TestClock clock = new TestClock(clockStartMillis);
        Replica replica = new Replica(id, registry, clock);
        clocks.put(id, clock);
        replicas.put(id, replica);
        heal();
        return replica;
    }

    public TestClock clock(String id) {
        return clocks.get(id);
    }

    public Replica node(String id) {
        return replicas.get(id);
    }

    /** Split the network. Nodes exchange operations only within their own group. */
    @SafeVarargs
    public final void partition(Set<String>... newGroups) {
        groups = new ArrayList<>(List.of(newGroups));
    }

    /** Reconnect everything. Operations still have to be exchanged — call settle(). */
    public void heal() {
        groups = new ArrayList<>(List.of(replicas.keySet()));
    }

    /**
     * Exchange operations until nothing more can be delivered.
     *
     * <p>Delivery is repeated to a fixed point rather than done once, because a node
     * can only forward what it has already received — a three-way partition needs
     * more than a single pass.
     */
    public void settle() {
        boolean progressed = true;
        int passes = 0;
        while (progressed) {
            progressed = false;
            for (Set<String> group : groups) {
                for (String from : group) {
                    for (String to : group) {
                        if (from.equals(to)) continue;
                        Replica target = replicas.get(to);
                        int before = target.log().size();
                        target.receiveAll(replicas.get(from).log());
                        if (target.log().size() != before) progressed = true;
                    }
                }
            }
            if (++passes > 100) fail("settle() did not reach a fixed point — delivery is not idempotent");
        }
    }

    /** Every replica must hold byte-identical state. Anything else is divergence. */
    public void assertConverged() {
        List<String> ids = new ArrayList<>(replicas.keySet());
        String reference = replicas.get(ids.get(0)).snapshot();
        for (String id : ids.subList(1, ids.size())) {
            String actual = replicas.get(id).snapshot();
            if (!reference.equals(actual)) {
                fail("Replicas diverged.\n\n--- " + ids.get(0) + " ---\n" + reference
                     + "\n--- " + id + " ---\n" + actual);
            }
        }
    }

    /** Convenience for tests that only care about the settled result. */
    public void healAndSettle() {
        heal();
        settle();
    }
}
