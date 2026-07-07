package com.dk_power.power_plant_java.dto.sds;

import lombok.Data;

import java.util.List;

/**
 * Payload for the batch-driven Sync PDFs endpoint. The client (Electron scraper) walks the
 * eBinder one chemical at a time and POSTs each with the running report so the backend can
 * accumulate across batches without holding server-side session state.
 */
@Data
public class SdsSyncPdfsRequestDto {
    /** Scraped chemicals in this batch — typically size 1 to keep base64 payloads bounded. */
    private List<SdsImportItemDto> items;

    /**
     * True for the first batch of a run — triggers preflight (duplicate-sharepointId check etc.).
     * Field is named {@code firstBatch} (not {@code isFirstBatch}) because Lombok generates
     * {@code isFirstBatch()} as the getter for either name, and Jackson would then serialize a
     * field literally named {@code isFirstBatch} as JSON property {@code firstBatch} — which
     * would silently drop any client sending {@code "isFirstBatch": true}. Naming it
     * {@code firstBatch} keeps the wire format and the field name aligned.
     */
    private boolean firstBatch;

    /** Preview mode: same scrape + hash comparison, no writes to local or SP. */
    private boolean dryRun;

    /** Report carried across batches so counts accumulate. Null on the first call. */
    private SdsSyncPdfsReportDto report;
}
