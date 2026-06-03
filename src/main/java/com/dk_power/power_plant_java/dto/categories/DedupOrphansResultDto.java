package com.dk_power.power_plant_java.dto.categories;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** Summary of one /values/dedup-orphans run. */
@Data
@NoArgsConstructor
public class DedupOrphansResultDto {

    /** True if no DB mutation was performed (preview only). */
    private boolean dryRun;

    /** Category alias the scan targeted. */
    private String categoryAlias;

    /** Number of orphan→canonical pairs found. */
    private int orphanCount;

    /** Sum of entity references that would be / were re-pointed. */
    private long totalReferencesAffected;

    /** Per-pair detail (one entry per orphan). */
    private List<DedupOperationDto> operations;
}
