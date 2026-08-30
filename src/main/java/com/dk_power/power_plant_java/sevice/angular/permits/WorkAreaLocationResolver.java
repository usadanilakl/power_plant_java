package com.dk_power.power_plant_java.sevice.angular.permits;

import com.dk_power.power_plant_java.entities.permits.WorkArea;
import com.dk_power.power_plant_java.repository.permits.WorkAreaRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

/**
 * Turns the free-text location on a permit into the work area it names.
 *
 * <p>Every permit type inherits a real {@code workArea} FK from {@code BasePermitEntity}, and that
 * FK is always the better answer — this resolver is the fallback for the rows that do not have one.
 * There are two large sources of those:
 *
 * <ul>
 *   <li>The PWA work-request form lets the requester pick an area <em>on the plant map</em>, but
 *       {@code PwaWorkRequestService.convertToEntity} only keeps the FK when the payload carried a
 *       {@code workAreaId}. Requests that arrive through SharePoint or the Power Automate fallback
 *       carry no id — the area survives only inside the composed
 *       {@code "<Area Name> - <detail>"} string in {@code locationOfWork}.</li>
 *   <li>Permits an operator typed a location into by hand, and everything created before the FK
 *       existed.</li>
 * </ul>
 *
 * <p>Matching is deliberately conservative, because a wrong match puts work on the wrong part of
 * the plant map, which is worse than leaving it off the map: it is name-boundary aware (so
 * "Boiler" does not match "Reboiler"), it prefers the LONGEST matching area name (so an area named
 * "Boiler Feed Pump Room" wins over one merely named "Boiler"), and it ignores names shorter than
 * {@link #MIN_NAME_LENGTH} characters, which would otherwise hit inside half the free text on the
 * plant.
 */
@Service
@RequiredArgsConstructor
public class WorkAreaLocationResolver {

    /**
     * Area names shorter than this are never text-matched. A two-character name ("U1", "HR") turns
     * up inside ordinary prose constantly, and one false placement costs more than every true one
     * such a name would have found.
     */
    private static final int MIN_NAME_LENGTH = 3;

    private final WorkAreaRepo workAreaRepo;

    /**
     * A prepared name index. Building it walks every work area, so callers that resolve a whole
     * table of permits build it ONCE and reuse it rather than paying that per row.
     */
    public static final class Index {
        private record Entry(Long id, String normalized) {}

        private final List<Entry> entries;

        private Index(List<Entry> entries) {
            this.entries = entries;
        }

        /**
         * The id of the area whose name appears in {@code text}, or null.
         *
         * <p>Entries are pre-sorted longest-name-first, so the first hit is the most specific one
         * and ties break on the smaller id — the same determinism rule the Category/Value dedup
         * survivor uses, so two nodes resolving the same string independently agree.
         */
        public Long match(String text) {
            String haystack = normalize(text);
            if (haystack.isEmpty()) return null;
            for (Entry e : entries) {
                if (containsAtWordBoundary(haystack, e.normalized())) return e.id();
            }
            return null;
        }

        public boolean isEmpty() {
            return entries.isEmpty();
        }
    }

    /** Build the index over every work area currently in the database. */
    public Index buildIndex() {
        return buildIndex(workAreaRepo.findAll());
    }

    /** Build the index over an already-loaded area list, so a caller that has one avoids a re-read. */
    public Index buildIndex(List<WorkArea> areas) {
        List<Index.Entry> entries = new ArrayList<>();
        for (WorkArea area : areas) {
            if (area == null || area.getId() == null) continue;
            String normalized = normalize(area.getName());
            // normalize() pads with a space at each end, so measure the name itself, not the padding.
            if (normalized.trim().length() < MIN_NAME_LENGTH) continue;
            entries.add(new Index.Entry(area.getId(), normalized));
        }
        entries.sort(Comparator
                .comparingInt((Index.Entry e) -> e.normalized().length()).reversed()
                .thenComparing(Index.Entry::id));
        return new Index(entries);
    }

    /** One-off convenience for a single lookup; prefer {@link #buildIndex()} for a batch. */
    public Long resolve(String locationText) {
        return buildIndex().match(locationText);
    }

    /**
     * Lower-case, and collapse everything that is not a letter or digit to a single space, padded
     * with one space at each end.
     *
     * <p>The padding is what makes {@link #containsAtWordBoundary} a plain {@code contains} check:
     * a name that matches is guaranteed to be flanked by separators rather than sitting inside a
     * longer word. It also makes the wildly inconsistent separators in real location text —
     * {@code "Unit 1 - Boiler"}, {@code "Unit-1/Boiler"}, {@code "UNIT 1: BOILER"} — normalize to
     * the same thing.
     */
    private static String normalize(String value) {
        if (value == null) return "";
        StringBuilder sb = new StringBuilder(value.length() + 2);
        sb.append(' ');
        boolean lastWasSpace = true;
        for (char c : value.toLowerCase(Locale.ROOT).toCharArray()) {
            if (Character.isLetterOrDigit(c)) {
                sb.append(c);
                lastWasSpace = false;
            } else if (!lastWasSpace) {
                sb.append(' ');
                lastWasSpace = true;
            }
        }
        if (!lastWasSpace) sb.append(' ');
        return sb.length() == 1 ? "" : sb.toString();
    }

    private static boolean containsAtWordBoundary(String paddedHaystack, String paddedNeedle) {
        return paddedHaystack.contains(paddedNeedle);
    }
}
