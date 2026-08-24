package com.dk_power.power_plant_java.entities.permits.pojo;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;

/**
 * Everything a requester declares about hazards, as one envelope.
 *
 * <p>Exists purely so the declaration can travel as a SINGLE SharePoint column. The local database
 * keeps each section in its own JSON column — this is the wire shape, not the storage shape.
 * Sections are added here freely; see {@link #hotWorkProfile} for why that costs nothing on the
 * SharePoint side.
 *
 * <h2>Why one column and not three (or fifty-one)</h2>
 * SharePoint never filters, sorts or reports on an individual hazard boolean; the reporting surface
 * for hazards is the permits, not the Work Requests list. So this is a payload, not a queryable
 * field, and every extra column would multiply the mapping sites (adapter in/out, field mapping,
 * snapshot extraction, selective apply) and the manual Power Automate designer work for no gain.
 *
 * <h2>Why it needs to be on SharePoint at all</h2>
 * When the hub is unreachable the PWA falls back to Power Automate and writes straight to
 * SharePoint. Without a column here the declaration was silently dropped on that path: the
 * requester saw "Submitted successfully", the hub later polled the item in, and an operator
 * generated permits from an apparently hazard-free request — indistinguishable from a request
 * where the contractor had genuinely ticked nothing.
 *
 * <h2>Consequence to know about</h2>
 * Every section moves as one last-writer-wins unit, keyed on the {@code declaredHazardsJson}
 * field's change timestamp. That is safe only while the requester is the sole editor, which is the
 * case today: the desktop work request form does not render these blocks (an operator edits hazards
 * on the generated permits instead) and SharePoint has no UI for them beyond the raw list. If
 * anything ever starts editing hazards on the SharePoint side, this needs revisiting.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class DeclaredHazards {

    private SwHazards hazards;
    private HotWorkMeasures hotWork;
    private ConfinedSpaceHazards confinedSpace;
    /**
     * Type of hot work planned, plus the Cr(VI) assessment when welding is involved.
     *
     * <p>Added after the SharePoint column already existed, and cost nothing on that side: both
     * ends carry {@code @JsonIgnoreProperties(ignoreUnknown = true)}, so an older hub reading a
     * newer envelope ignores this key instead of failing, and a newer hub reading an older envelope
     * simply gets null. That tolerance is the reason to keep putting declaration sections in this
     * envelope rather than minting a SharePoint column each time.
     */
    private HotWorkProfile hotWorkProfile;

    private static final ObjectMapper MAPPER = new ObjectMapper();

    public DeclaredHazards() {
    }

    public DeclaredHazards(SwHazards hazards, HotWorkMeasures hotWork,
                           ConfinedSpaceHazards confinedSpace, HotWorkProfile hotWorkProfile) {
        this.hazards = hazards;
        this.hotWork = hotWork;
        this.confinedSpace = confinedSpace;
        this.hotWorkProfile = hotWorkProfile;
    }

    /**
     * Serialise for the SharePoint column, or null when nothing was declared.
     *
     * <p>Returns null rather than an empty envelope so the column stays genuinely empty for
     * requests that carry no declaration — otherwise every legacy row would gain a meaningless
     * {@code {}} on its next sync pass and look like it had been edited.
     */
    public static String toJson(SwHazards hazards, HotWorkMeasures hotWork,
                                ConfinedSpaceHazards confinedSpace, HotWorkProfile hotWorkProfile) {
        if (isEmpty(hazards) && isEmpty(hotWork) && isEmpty(confinedSpace) && isEmpty(hotWorkProfile)) {
            return null;
        }
        try {
            return MAPPER.writeValueAsString(
                    new DeclaredHazards(hazards, hotWork, confinedSpace, hotWorkProfile));
        } catch (Exception e) {
            // A declaration that cannot be serialised must not fail the submission it belongs to;
            // the local columns still hold it and only the SharePoint copy is lost.
            return null;
        }
    }

    /** Parse a SharePoint envelope. Never throws — unreadable content reads as "nothing declared". */
    public static DeclaredHazards fromJson(String json) {
        if (json == null || json.isBlank() || "null".equals(json.trim())) {
            return new DeclaredHazards();
        }
        try {
            DeclaredHazards parsed = MAPPER.readValue(json, DeclaredHazards.class);
            return parsed != null ? parsed : new DeclaredHazards();
        } catch (Exception e) {
            return new DeclaredHazards();
        }
    }

    /**
     * Does this block have anything ticked or filled in?
     *
     * <p>Compares against a fresh instance rather than reflecting over fields, so it stays correct
     * as hazards are added to the POJOs. All-false equals a fresh instance and counts as empty:
     * that is deliberate at the WIRE level only — locally an all-false declaration is a real answer
     * ("I checked, none apply") and is stored, but there is nothing worth putting on SharePoint.
     */
    private static boolean isEmpty(Object block) {
        if (block == null) return true;
        try {
            Object fresh = block.getClass().getDeclaredConstructor().newInstance();
            return block.equals(fresh);
        } catch (Exception e) {
            return false;
        }
    }
}
