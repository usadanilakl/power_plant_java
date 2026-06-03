package com.dk_power.power_plant_java.dto.categories;

import lombok.Data;
import lombok.NoArgsConstructor;

/** One orphan→canonical pair processed by a dedup run. */
@Data
@NoArgsConstructor
public class DedupOperationDto {

    private Long orphanId;
    private String orphanName;
    private Long canonicalId;
    private String canonicalName;

    /** Entities re-pointed by this single merge. */
    private long referenceCount;

    /** {@code dry-run}, {@code merged}, or {@code error: <message>}. */
    private String status;
}
