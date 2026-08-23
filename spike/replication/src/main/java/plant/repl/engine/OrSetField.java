package plant.repl.engine;

import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;

/**
 * Observed-remove set.
 *
 * <p>Each add carries a unique tag (the operation id). An element is present while it
 * holds at least one tag that has not been removed. A remove names only the tags it
 * actually observed, so an add made concurrently elsewhere carries a tag the remover
 * never saw and therefore survives — add-wins, without any coordination.
 *
 * <p>This is what the current system's comma-separated {@code equipmentIds} and
 * {@code fileIds} fields cannot do: stored as one string under whole-value
 * last-writer-wins, two replicas each adding a different member concurrently means
 * one set of additions is silently discarded.
 */
public final class OrSetField {

    private final Map<String, Set<String>> tagsByElement = new TreeMap<>();
    private final Set<String> removedTags = new TreeSet<>();

    public void add(String element, String tag) {
        tagsByElement.computeIfAbsent(element, k -> new TreeSet<>()).add(tag);
    }

    public void remove(String element, Set<String> observedTags) {
        removedTags.addAll(observedTags);
        // Tags not yet seen locally may arrive later; they are already recorded as
        // removed, so a late-arriving add of an observed tag stays removed. Order of
        // delivery does not change the outcome.
    }

    /** Tags currently visible for an element — what a remove would observe. */
    public Set<String> observedTags(String element) {
        Set<String> tags = new TreeSet<>(tagsByElement.getOrDefault(element, Set.of()));
        tags.removeAll(removedTags);
        return tags;
    }

    public boolean contains(String element) {
        return !observedTags(element).isEmpty();
    }

    public Set<String> elements() {
        Set<String> present = new TreeSet<>();
        for (String element : tagsByElement.keySet()) {
            if (contains(element)) present.add(element);
        }
        return present;
    }

    /** Canonical form for convergence comparison. */
    @Override
    public String toString() {
        return elements().toString();
    }
}
