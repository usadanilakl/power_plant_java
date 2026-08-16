package com.dk_power.power_plant_java.dto.admin;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/**
 * Snapshot of Maximo Field List bridge health. Powers the admin drift dashboard —
 * four buckets that operators need to see so a hung backfill or a missed completion
 * doesn't stay silent. All counts are total-across-all-rows; {@link #samples} carries
 * the top-N rows per bucket for at-a-glance drill-down.
 */
@Data
@NoArgsConstructor
public class MaximoFieldListDriftDto {

    /** Rows whose initial Maximo create attempt failed and are queued for backfill retry. */
    private BucketDto createPending;

    /** Rows soft-deleted locally whose Maximo cancel call failed and are queued for backfill retry. */
    private BucketDto cancelPending;

    /** Rows whose local status flipped to wo-completion-status but the WO COMP call failed. Backfill will retry. */
    private BucketDto completePending;

    /**
     * Rows where Maximo shows a terminal status (SR: CLOSED/CANCELLED; WO: COMP/CLOSE/CAN)
     * but the local FieldList is still in an open status. Ops closed it on their side, but
     * the PWA still shows the report open — someone should close it locally too.
     */
    private BucketDto maximoClosedLocalOpen;

    /**
     * Rows where the local FieldList is closed but the Maximo record is still open (WO-only
     * failure mode: {@code wo-completion-status} hit but the {@code bridge.complete()} call
     * failed silently). The WO is still in ops' queue and someone should re-trigger the close.
     */
    private BucketDto localClosedMaximoOpen;

    /** Total rows routed to Maximo (recordId not null) — for context alongside the buckets. */
    private long totalRoutedToMaximo;

    /**
     * Wall-clock instant this snapshot was computed on the hub. Useful for the UI to render
     * a "last refreshed" hint since drift is checked on-demand rather than continuously.
     */
    private Instant computedAt;

    @Data
    @NoArgsConstructor
    public static class BucketDto {
        /** Total row count across the WHOLE table for this bucket. */
        private long count;
        /** Age in days of the OLDEST row in the bucket, or null if the bucket is empty. */
        private Long oldestAgeDays;
        /** Newest-first sample rows for drill-down; capped by the endpoint's {@code limit} param. */
        private List<MaximoFieldListDriftRowDto> samples;
    }
}
