package com.dk_power.power_plant_java.dto.sds;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * Result of an admin SP-sync helper (push-all / pull-all / clear-all). Counts let the operator
 * confirm what happened; {@code errors} surfaces per-row failures without aborting the whole
 * operation. Both clear-all and pull-all flow through the sync layer — the hub propagates the
 * resulting changes to every other client and to SharePoint.
 */
@Data
public class SdsSyncReportDto {
    private int chemicalsCreated;
    private int chemicalsUpdated;
    private int chemicalsDeleted;
    private int attachmentsAdded;
    private int attachmentsRemoved;
    private List<String> errors = new ArrayList<>();
}
