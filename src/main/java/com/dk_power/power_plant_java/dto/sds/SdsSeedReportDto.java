package com.dk_power.power_plant_java.dto.sds;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * Result of seeding the SDS inventory from the bundled book-to-eBinder match map.
 * Created/updated count the records loaded into the DB (metadata only, no PDFs);
 * {@code unmatchedBookEntries} are book slots with no row in the eBinder export (not loaded).
 */
@Data
public class SdsSeedReportDto {
    private int matchedSlots;      // book slots bound to a website chemical
    private int created;           // new chemicals created (Filed)
    private int updated;           // existing chemicals updated
    private int unmatchedCount;    // book entries with no eBinder match

    /** Book entries (name + address) that had no matching row in the eBinder export. */
    private List<String> unmatchedBookEntries = new ArrayList<>();
}
