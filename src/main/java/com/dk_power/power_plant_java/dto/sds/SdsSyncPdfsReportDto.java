package com.dk_power.power_plant_java.dto.sds;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * Result of a Sync-PDFs run. Field names are UI-facing (operator-readable) rather than internal
 * branch labels — the Electron page renders them directly. See {@link ErrorEntry#stage} for
 * where a per-chemical failure occurred, so an operator can tell whether SharePoint or local
 * state is the one that needs cleanup after a partial failure.
 */
@Data
public class SdsSyncPdfsReportDto {

    /** Total items visited during the eBinder walk. */
    private int chemicalsChecked;

    /** eBinder PDF hash already matched a live local attachment → no changes needed. */
    private int alreadyUpToDate;

    /** Chemical had a stale/missing PDF; replaced with the eBinder copy (local + SP). */
    private int updated;

    /** eBinder listed the chemical but we don't have it locally — Close-gaps would import it. */
    private int notInOurSystem;

    /** eBinder listed the chemical but we couldn't capture its PDF this run — existing PDFs preserved. */
    private int ebinderHadNoPdf;

    /** eBinder listed the chemical but the PDF failed structural validation (corrupt/truncated). */
    private int rejectedInvalidPdf;

    /** Multiple local rows share this sourceId — refusing to auto-pick. */
    private int ambiguousSourceId;

    /** Chemical has no sharepointId; local was updated, SP was skipped (surfaced so ops can review). */
    private int localOnlyNoSpId;

    /** Peer safety: local sharepointId no longer exists on SP (row deleted at source). */
    private int sharepointRowMissing;

    /** True when this was a preview / dry-run — no writes to local or SP. */
    private boolean dryRun;

    /** Non-blocking diagnostic notes (e.g. "eBinder scraped only 60% of last run — investigate"). */
    private List<String> warnings = new ArrayList<>();

    /** Blocking preflight failures — sync aborted before any writes. */
    private List<String> preflightBlockers = new ArrayList<>();

    /** Per-chemical error details with the stage that failed. */
    private List<ErrorEntry> errors = new ArrayList<>();

    @Data
    public static class ErrorEntry {
        private String sourceId;
        private String chemicalName;
        /** {@code SP_ADD}, {@code SP_DELETE_OLD}, {@code LOCAL_INSERT}, {@code LOCAL_TOMBSTONE},
         *  {@code CAPTURE}, {@code HASH}, or {@code PREFLIGHT}. Operator uses this to figure out
         *  whether SP or local was left in a partial state. */
        private String stage;
        private String message;

        public ErrorEntry() {}
        public ErrorEntry(String sourceId, String chemicalName, String stage, String message) {
            this.sourceId = sourceId;
            this.chemicalName = chemicalName;
            this.stage = stage;
            this.message = message;
        }
    }
}
