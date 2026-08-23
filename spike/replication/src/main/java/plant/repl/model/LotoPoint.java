package plant.repl.model;

import plant.repl.merge.Merge;
import plant.repl.merge.MergeKind;

import java.util.Set;

/**
 * A slice of the real {@code LotoPoint}, carrying only what the replication question
 * needs: one field of each merge kind, plus the collections the current model gets
 * wrong.
 *
 * <p>This class holds no state at runtime. It is a <em>schema</em> — the engine reads
 * its annotations through {@link MergeRegistry} and stores values generically. That
 * separation is the point being tested: if it holds, adding an entity to replication
 * costs annotations only.
 *
 * <p>Field choices, and why:
 *
 * <ul>
 *   <li>{@code description}, {@code specificLocation} — losing a concurrent edit is
 *       annoying, not dangerous. {@link MergeKind#LWW}.</li>
 *   <li>{@code isolatedPosition}, {@code normalPosition} — a LOTO point's isolation
 *       state. Two people isolating the same equipment from disconnected desktops
 *       must not have one answer silently vanish. {@link MergeKind#MANUAL}.</li>
 *   <li>{@code equipmentIds}, {@code lotoStandardIds} — collections. The real system
 *       stores these as comma-separated strings under whole-value LWW, so concurrent
 *       additions on two replicas lose one side. {@link MergeKind#ORSET}.</li>
 * </ul>
 */
public final class LotoPoint {

    @Merge(MergeKind.LWW)
    String unit;

    @Merge(MergeKind.LWW)
    String tagNumber;

    @Merge(MergeKind.LWW)
    String description;

    @Merge(MergeKind.LWW)
    String specificLocation;

    /** Safety-relevant: a lost edit here is a lost isolation instruction. */
    @Merge(MergeKind.MANUAL)
    String isolatedPosition;

    @Merge(MergeKind.MANUAL)
    String normalPosition;

    /** Reference to a {@code Value}. Scalar id, so ordinary LWW. */
    @Merge(MergeKind.LWW)
    String processingStatusId;

    /** ManyToMany in the real model; a comma-separated LWW string today. */
    @Merge(MergeKind.ORSET)
    Set<String> equipmentIds;

    /** ManyToMany in the real model. */
    @Merge(MergeKind.ORSET)
    Set<String> lotoStandardIds;

    private LotoPoint() {
        throw new UnsupportedOperationException("schema only — the engine holds state");
    }
}
