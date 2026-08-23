package plant.repl.oplog;

import plant.repl.clock.Hlc;

import java.util.Set;
import java.util.TreeSet;

/**
 * One entry in the append-only operation log.
 *
 * <p>Written deliberately, in the same transaction as the data it describes — never inferred
 * from an ORM lifecycle callback.
 *
 * @param opId       globally unique, and stable across a restart. Derived from the node and its
 *                   clock stamp, both of which are persisted, so a restarted node cannot reissue
 *                   an identifier it has already spent.
 * @param seq        this node's own contiguous counter. Lets a receiver notice an interior gap
 *                   — "I hold 1..40 and 42". Persisted with the clock.
 * @param parents    for SET: every stamp this write **observed** for that field. Not the stamp
 *                   of the current winner — the whole visible frontier. Concurrency is then a
 *                   property of the operation graph rather than of what happened to arrive
 *                   first, which is what makes it order-independent.
 * @param condition  an optional requirement — "provided nobody is signed on". If it does not
 *                   hold when applied, the operation does not apply.
 * @param signature  proof this came from the node it claims to. Empty for now; the field exists
 *                   because it cannot be added to records already written.
 */
public record Operation(
        String opId,
        long seq,
        String entityType,
        String entityId,
        String field,
        OpKind kind,
        String value,
        Set<Hlc> parents,
        Set<String> seenTags,
        String condition,
        String signature,
        Hlc hlc
) {

    public Operation {
        parents = parents == null ? Set.of() : Set.copyOf(parents);
        seenTags = seenTags == null ? Set.of() : Set.copyOf(seenTags);
    }

    /** Identifier built from node and clock. Both persist, so this survives a restart. */
    public static String idFor(Hlc stamp) {
        return stamp.nodeId() + ":" + stamp.physical() + ":" + stamp.logical();
    }

    public static Operation set(long seq, String type, String id, String field,
                                String value, Set<Hlc> parents, String condition, Hlc hlc) {
        return new Operation(idFor(hlc), seq, type, id, field, OpKind.SET, value,
                new TreeSet<>(parents), Set.of(), condition, "", hlc);
    }

    public static Operation add(long seq, String type, String id, String field,
                                String element, Hlc hlc) {
        return new Operation(idFor(hlc), seq, type, id, field, OpKind.ADD, element,
                Set.of(), Set.of(), null, "", hlc);
    }

    public static Operation remove(long seq, String type, String id, String field,
                                   String element, Set<String> seenTags, Hlc hlc) {
        return new Operation(idFor(hlc), seq, type, id, field, OpKind.REMOVE, element,
                Set.of(), new TreeSet<>(seenTags), null, "", hlc);
    }

    public String entityKey() {
        return entityType + "#" + entityId;
    }

    public String fieldKey() {
        return entityKey() + "." + field;
    }

    public String nodeId() {
        return hlc.nodeId();
    }
}
