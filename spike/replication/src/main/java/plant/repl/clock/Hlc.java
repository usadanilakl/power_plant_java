package plant.repl.clock;

/**
 * A hybrid logical clock stamp: physical milliseconds, a logical counter, and the
 * node that produced it.
 *
 * <p>Replaces the raw {@code Instant} the current system uses. Wall clock alone is
 * only a correct ordering key if every machine's clock agrees, and desktops here run
 * partitioned for long periods — exactly when clocks drift furthest. See ADR-0009.
 *
 * <p>The physical component keeps stamps human-readable and roughly aligned with real
 * time; the logical component preserves causality when physical time is equal or
 * moving backwards. Node id breaks remaining ties so that every replica resolves
 * identically.
 */
public record Hlc(long physical, int logical, String nodeId) implements Comparable<Hlc> {

    public static final Hlc ZERO = new Hlc(0L, 0, "");

    @Override
    public int compareTo(Hlc other) {
        int byPhysical = Long.compare(physical, other.physical);
        if (byPhysical != 0) return byPhysical;
        int byLogical = Integer.compare(logical, other.logical);
        if (byLogical != 0) return byLogical;
        return nodeId.compareTo(other.nodeId);
    }

    /** True when this stamp is strictly later in the total order. */
    public boolean isAfter(Hlc other) {
        return compareTo(other) > 0;
    }

    @Override
    public String toString() {
        return physical + ":" + logical + "@" + nodeId;
    }
}
