package com.dk_power.power_plant_java.dto.admin;

import lombok.Data;

import java.util.List;

/**
 * Preview payload for the Drift Center's "Bulk-cancel Maximo orphans" action. Returned by
 * the preview endpoint so an admin can see the candidate rows BEFORE hitting execute — the
 * criteria (Maximo statuses + local statuses) are echoed back so the UI can confirm what
 * would be actioned, and the sample list drives an on-screen review table.
 */
@Data
public class MaximoBulkCancelPreviewDto {
    /** Total candidate count (may exceed samples.size() when the query is capped). */
    private long candidateCount;
    /** Sample rows for the admin to eyeball — same shape as the drift drill-down. */
    private List<MaximoFieldListDriftRowDto> samples;
    /** Echoed criteria so the UI can label the confirmation dialog. */
    private List<String> maximoStatuses;
    private List<String> localStatuses;
}
