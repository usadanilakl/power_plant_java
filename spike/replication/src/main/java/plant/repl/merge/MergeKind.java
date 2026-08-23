package plant.repl.merge;

/**
 * The merge policies a field may declare.
 *
 * <p>Kept deliberately small. Every kind added here costs a branch in the engine and
 * a case in the simulator, and the testing convention requires that a kind with no
 * simulator case fails the build.
 */
public enum MergeKind {

    /**
     * Last writer wins by {@link plant.repl.clock.Hlc} order. Concurrent edits are
     * resolved silently and the loser is discarded.
     *
     * <p>Correct for fields where a stale value is harmless and losing one is
     * acceptable — descriptions, notes, cached labels.
     */
    LWW,

    /**
     * Observed-remove set. Concurrent add and remove of the same element resolves
     * add-wins; concurrent adds of different elements both survive.
     *
     * <p>Correct for collections. The current system stores several of these as
     * comma-separated strings under whole-value LWW ({@code equipmentIds},
     * {@code fileIds}), which means two replicas adding different members
     * concurrently silently lose one set of additions.
     */
    ORSET,

    /**
     * Like {@link #LWW} for convergence — every replica settles on the same
     * provisional value — but a genuine concurrent edit is <em>recorded as a
     * conflict</em> for a human to resolve rather than silently discarded.
     *
     * <p>Correct where losing an edit is a safety or compliance problem. Isolation
     * positions on a LOTO point are the motivating case: two people isolating the
     * same equipment from disconnected desktops must not have one answer vanish.
     */
    MANUAL
}
