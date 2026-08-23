package plant.repl.engine;

import java.util.Set;

/** A field several people wrote independently. Derived from the log, never stored. */
public record Conflict(String entityKey, String field, Set<String> values) {

    @Override
    public String toString() {
        return entityKey + "." + field + " " + values;
    }
}
