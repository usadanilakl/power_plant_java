package com.dk_power.power_plant_java.dto.sds;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * Result of a source import + reconcile against the eBinder snapshot.
 * {@code newChemicals}/{@code revisedChemicals}/{@code missingFromSource} form the audit report.
 */
@Data
public class SdsImportReportDto {
    private int sourceCount;       // items received from the source
    private int created;           // new chemicals created (Incoming)
    private int updated;           // existing chemicals updated
    private int pdfsAttached;      // SDS PDFs attached

    /** In the source but not previously in our system (newly created). */
    private List<String> newChemicals = new ArrayList<>();
    /** Matched chemicals whose source Revision Date changed (a newer SDS exists → re-file). */
    private List<String> revisedChemicals = new ArrayList<>();
    /** Active chemicals in our system whose primary name was NOT in the source snapshot. */
    private List<String> missingFromSource = new ArrayList<>();
}
