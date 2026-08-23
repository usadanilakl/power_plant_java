package plant.repl.oplog;

/** What an {@link Operation} does to a field. */
public enum OpKind {
    /** Replace a scalar value. Carries {@code basedOn} for concurrency detection. */
    SET,
    /** Add an element to an OR-Set field. The operation id becomes the add-tag. */
    ADD,
    /** Remove an element from an OR-Set field, carrying the tags it observed. */
    REMOVE
}
