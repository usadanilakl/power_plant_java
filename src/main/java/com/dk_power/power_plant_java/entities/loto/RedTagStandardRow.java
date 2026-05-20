package com.dk_power.power_plant_java.entities.loto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * One isolation-device row from a Red Tag standard table. Stored as JSON
 * inside {@link RedTagStandard#getRowsJson()} — one entry per table row.
 *
 * <p>The {@link #pnid} field is the device tag as it appears in Red Tag
 * (the "Isolation Device PNID" column). It is the key the digitization
 * flow matches against {@code LotoPoint.tagNumber} to suggest existing
 * LOTO points or flag a row as needing a new point.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RedTagStandardRow {

    /** 1-based row index as printed in the Red Tag table's "Tag #" column. */
    private int rowNumber;

    /** Tag color/type from the "Attachment" column — typically "Danger". */
    private String tagType;

    /** Free-text "Isolation Device Description". */
    private String description;

    /** "Isolation Device PNID" — the device tag; match key against LotoPoint.tagNumber. */
    private String pnid;

    /** Position the device is left in for isolation (CLOSED / OPEN / THROTTLED). */
    private String isolatedPosition;

    /** Position the device sits in during normal operation. */
    private String normalPosition;
}
