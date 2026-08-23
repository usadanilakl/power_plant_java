package plant.repl.clock;

import java.util.function.LongSupplier;

/**
 * Per-node hybrid logical clock.
 *
 * <p>Guarantees that if A causally precedes B then {@code A.hlc < B.hlc} on every node, whatever
 * the machines' wall clocks say. It does **not** decide who wins between two writes made
 * independently — for that see {@link plant.repl.engine.FieldLog}, which looks at the operation
 * graph instead.
 *
 * <p><b>State must survive a restart.</b> The clock and the sequence number are both persisted.
 * A node that restarts with either reset reissues identifiers it has already spent, and peers
 * silently discard the new work as duplicates.
 */
public final class HybridLogicalClock {

    /**
     * How far ahead of local time a remote stamp may be before it is quarantined.
     *
     * <p>Without a ceiling, one operation stamped a century ahead drags every node that sees it
     * to that time permanently — and since clock state is part of the backup, restoring brings
     * it straight back. No attacker is needed: a restored machine image or a dead battery does
     * it.
     *
     * <p>Choosing the value is a trade, and getting it wrong in the tight direction is worse than
     * in the loose one. It must exceed <em>the longest plausible partition plus the worst
     * plausible clock error</em>, because a receiver cannot tell "their clock is ahead" from "my
     * clock is behind" — and if it refuses on that basis it will silently discard a fortnight of
     * a colleague's work. It must stay short enough that a clock dragged forward recovers by
     * itself.
     *
     * <p>Thirty days satisfies both: a month-long partition passes, and the worst case is a clock
     * a month fast which real time catches up with.
     *
     * <p><b>Quarantine is not rejection.</b> An operation past the ceiling is held, not dropped,
     * and is reconsidered later. A tight ceiling then costs a delay and a visible held item
     * rather than lost work.
     */
    public static final long MAX_SKEW_MILLIS = 30L * 24 * 60 * 60 * 1000L;

    private final String nodeId;
    private final LongSupplier physicalTimeMillis;

    private long physical;
    private int logical;
    private long seq;

    public HybridLogicalClock(String nodeId, LongSupplier physicalTimeMillis) {
        this.nodeId = nodeId;
        this.physicalTimeMillis = physicalTimeMillis;
    }

    /** Stamp for a new local operation. */
    public synchronized Hlc tick() {
        long now = physicalTimeMillis.getAsLong();
        if (now > physical) {
            physical = now;
            logical = 0;
        } else {
            logical++;
        }
        return new Hlc(physical, logical, nodeId);
    }

    /** The next sequence number for this node. Contiguous, so a receiver can see gaps. */
    public synchronized long nextSeq() {
        return ++seq;
    }

    /**
     * Account for an operation seen from another node.
     *
     * @return false if the stamp is implausibly far ahead and was refused
     */
    public synchronized boolean observe(Hlc remote) {
        long now = physicalTimeMillis.getAsLong();
        if (remote.physical() > now + MAX_SKEW_MILLIS) {
            return false;
        }
        long previous = physical;
        long merged = Math.max(Math.max(previous, remote.physical()), now);

        if (merged == previous && merged == remote.physical()) {
            logical = Math.max(logical, remote.logical()) + 1;
        } else if (merged == previous) {
            logical++;
        } else if (merged == remote.physical()) {
            logical = remote.logical() + 1;
        } else {
            logical = 0;
        }
        physical = merged;
        return true;
    }

    /** Everything that must be written down before this node stops. */
    public synchronized State state() {
        return new State(physical, logical, seq);
    }

    public synchronized void restore(State s) {
        this.physical = s.physical();
        this.logical = s.logical();
        this.seq = s.seq();
    }

    public String nodeId() {
        return nodeId;
    }

    /** Persisted clock state. Losing this is a correctness bug, not a cosmetic one. */
    public record State(long physical, int logical, long seq) {}
}
