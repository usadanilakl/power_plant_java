package com.dk_power.power_plant_java.sevice.automation.redtag.statesync;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * One scraped row from a Red Tag "Status : {STATUS}" tab group.
 *
 * <p>Fields are populated from a single OCR pass over the expanded tab region
 * — see {@link com.dk_power.power_plant_java.sevice.automation.redtag.flow.RedTagStateSyncFlow}.
 * Any field the OCR could not confidently parse is left blank rather than
 * guessed; the reconciler treats blank as "unknown", not "empty".
 *
 * <p>{@link #lotoNumber} is the strong match key (6-digit numeric); {@link #lockBox}
 * is the fall-back for ACTIVE rows before the local system knows the RT number.
 * {@link #jobDescription} and {@link #requestor} feed the LWW field-update side
 * of the plan (whichever side edited last should win, but scraping is a pull,
 * so RT is authoritative here by definition for any diffing field).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RedTagRow {
    /** Red Tag's 6-digit LOTO number, blank if OCR couldn't parse it. */
    private String lotoNumber;
    /** Lock box number as text (may be non-numeric on legacy rows). */
    private String lockBox;
    /** Job description text — often multi-word, may run into the next column. */
    private String jobDescription;
    /** Requestor (owner) name as shown on the row. */
    private String requestor;
}
