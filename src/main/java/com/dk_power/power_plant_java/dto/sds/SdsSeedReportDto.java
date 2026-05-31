package com.dk_power.power_plant_java.dto.sds;

import lombok.Data;

/**
 * Result of seeding the SDS inventory from the bundled book-to-eBinder match map.
 * Matched slots get the real eBinder Document ID; unmatched book slots get a synthetic
 * {@code BOOK-{book}-{section}} sourceId and surface in the gap report's "missing from eBinder"
 * category so operators can manually map them later. All counts are for *this* seed call.
 */
@Data
public class SdsSeedReportDto {
    private int matchedSlots;     // book slots bound to a real eBinder Document ID
    private int bookOnlyCount;    // book slots loaded with synthetic BOOK-{book}-{section} ids
    private int created;          // new chemicals created in the DB
    private int updated;          // existing chemicals upserted (no-op for unchanged rows)
}
