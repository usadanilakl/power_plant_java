package com.dk_power.power_plant_java.dto.maximo;

import lombok.Data;

import java.util.List;

/**
 * Payload for the "complete work order" flow: report actual labor, add a worklog note,
 * then (optionally) change status. Mirrors the manual Maximo steps:
 *   1. add Labor rows (who + hours)  2. add a Log (Summary + Details)  3. Complete the WO.
 */
@Data
public class CompleteWorkOrderRequest {

    /** Actual-labor rows to add. A blank {@link LaborEntry#laborcode} defaults to the signed-in user's Maximo personid. */
    private List<LaborEntry> labor;

    /** Worklog "Summary" (short description). */
    private String summary;

    /** Worklog "Details" (long description). Optional. */
    private String details;

    /** Worklog log type; defaults to CLIENTNOTE (WORK is not a valid WO worklog type on this instance). */
    private String logtype;

    /** When true, change the WO status after recording actuals. Defaults to true in the service. */
    private Boolean complete;

    /** Target status for the change (defaults to COMP). */
    private String status;

    /** Memo recorded with the status change. */
    private String memo;

    @Data
    public static class LaborEntry {
        /** Maximo LABTRANS.laborcode (uppercase personid). Blank = signed-in user. */
        private String laborcode;
        /** Regular hours worked. */
        private Double regularhrs;
    }
}
