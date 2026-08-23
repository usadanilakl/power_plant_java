package plant.repl.merge;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Declares how a field resolves when two replicas change it concurrently.
 *
 * <p>This is the core bet of ADR-0007: merge behaviour is <em>declared on the field</em>
 * and interpreted by one engine, rather than coded per entity. The current system's
 * 42,708 replication lines are largely per-entity special cases — three-pass
 * application, relationship retry, bespoke handling per type. If that hypothesis is
 * right, the engine stays small and new entities cost only annotations.
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
public @interface Merge {
    MergeKind value();
}
