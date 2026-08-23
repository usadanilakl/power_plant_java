package plant.repl.engine;

import java.util.Set;

/**
 * What a field currently reads as.
 *
 * <p>A caller cannot obtain the value without also being handed {@code contested}. That is
 * deliberate: the earlier design returned a bare string, so a disputed isolation position
 * rendered on screen as a settled answer.
 */
public record FieldValue(String value, boolean contested, Set<String> competing) {

    public static final FieldValue ABSENT = new FieldValue(null, false, Set.of());

    /** True when this field cannot be acted on without a person resolving it first. */
    public boolean needsPerson() {
        return contested;
    }

    @Override
    public String toString() {
        return contested ? "CONTESTED" + competing : String.valueOf(value);
    }
}
