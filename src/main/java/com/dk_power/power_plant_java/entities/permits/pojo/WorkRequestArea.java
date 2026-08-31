package com.dk_power.power_plant_java.entities.permits.pojo;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * One work area a request covers, and what is planned there.
 *
 * <h2>Why a request needs more than one</h2>
 *
 * A package already holds several Confined Space permits, and the builder already has a button to
 * add them — an operator can assemble "one Inspection package, one Safe Work, five Confined Spaces"
 * by hand today. What they could not do is have it generated, because the request could only ever
 * name ONE area and ONE space.
 *
 * <h2>Why only two flags, and not a hot-work profile per area</h2>
 *
 * The three permit types have genuinely different multiplicity:
 *
 * <ul>
 *   <li><b>Safe Work</b> — one, spanning every area. Nothing in it is location-bound. The operator
 *       may still choose to split it per area at generation time.</li>
 *   <li><b>Confined Space</b> — one per space, always. Atmosphere readings, entrants and the
 *       attendant are all specific to the space.</li>
 *   <li><b>Hot Work</b> — one per area where hot work is actually done, which is usually a subset.
 *       A fire watch cannot be in two places.</li>
 * </ul>
 *
 * So an area carries the two answers that decide how many permits exist ({@link #confinedSpaceEntry}
 * and {@link #hotWork}) and nothing else. The hot-work DETAIL — types, welding method, the Cr(VI)
 * assessment — stays on the request itself, asked once: it is the same crew doing the same job, so
 * the kind of welding does not change between areas. Asking for it per area would produce five
 * copy-pasted answers, which is worse information than one honest one, and it is exactly the wall
 * of questions the guided flow exists to remove.
 *
 * <p>The generated Hot Work permits are each seeded from that single profile plus their own area's
 * constant measures, and the operator completes them per permit — which is where the real knowledge
 * is. Fire watch in particular is deliberately left to the operator: at request time the requester
 * usually does not know who it will be in each area, and an empty field they must fill is better
 * than a plausible name nobody checked.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class WorkRequestArea {

    private Long id;
    private String name;

    /**
     * The area everything that expects a single one uses: the job grouping key, the scored job
     * match, and where the request is drawn on the permits map. First picked, and reorderable.
     */
    private boolean primary;

    /** Entry planned here — generates one Confined Space permit for this area. */
    private boolean confinedSpaceEntry;

    /** The vessel or space, when it is not simply the area's own name. */
    private String spaceName;

    /** Hot work planned here — generates one Hot Work permit for this area. */
    private boolean hotWork;

    private static final ObjectMapper MAPPER = new ObjectMapper();

    /**
     * Parse the stored list. Never throws: an unreadable value means "no additional areas", and a
     * work request is read on every table page and every sync pass — one malformed row must not be
     * able to fail a page load.
     */
    public static List<WorkRequestArea> fromJson(String json) {
        if (json == null || json.isBlank() || "null".equals(json.trim())) return new ArrayList<>();
        try {
            List<WorkRequestArea> parsed = MAPPER.readValue(json, new TypeReference<>() {});
            return parsed != null ? parsed : new ArrayList<>();
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    /** Null for an empty list, so "no opinion" and "explicitly none" stay distinguishable. */
    public static String toJson(List<WorkRequestArea> areas) {
        if (areas == null || areas.isEmpty()) return null;
        try {
            return MAPPER.writeValueAsString(areas);
        } catch (Exception e) {
            throw new RuntimeException("Cannot serialize work request areas", e);
        }
    }

    /** The primary area, or the first one, or null. */
    public static WorkRequestArea primaryOf(List<WorkRequestArea> areas) {
        if (areas == null || areas.isEmpty()) return null;
        return areas.stream().filter(WorkRequestArea::isPrimary).findFirst().orElse(areas.get(0));
    }
}
