package com.dk_power.power_plant_java.sevice.etapro;

import com.dk_power.power_plant_java.repository.etapro.EtaProLogEntryRepo;
import com.dk_power.power_plant_java.sevice.etapro.EtaProScraperEngine.BatchResult;
import com.dk_power.power_plant_java.sevice.etapro.EtaProScraperEngine.Template;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Pulls EtaPRO Event Log entries via the EPLog template.
 *
 * <p>v1 is manual-trigger only (UI "Refresh" button). Auto-pull (a timed worker branch)
 * and date-range backfill are planned follow-ups (see eplog-scraper-plan.md).
 *
 * <p>Incremental pulls use the newest stored Create Time as a watermark, re-pulling a small
 * overlap window for boundary safety; the engine deduplicates on the composite key.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "etapro.enabled", havingValue = "true", matchIfMissing = false)
public class EtaProLogPullService {

    private final EtaProScraperEngine engine;
    private final EtaProLogEntryRepo logRepo;

    /** First-run window when the table is empty. */
    @Value("${etapro.eplog.backfill.days:30}")
    private int backfillDays;

    /** Re-pull overlap behind the watermark so boundary entries aren't missed. */
    @Value("${etapro.eplog.window.overlap.minutes:60}")
    private int overlapMinutes;

    /**
     * Pull entries newer than the current watermark (MAX createTime), with overlap.
     * On an empty table, pulls the last {@code backfillDays} days.
     */
    public BatchResult pullIncremental() {
        LocalDateTime end = LocalDateTime.now();
        LocalDateTime watermark = logRepo.findMaxCreateTime();
        LocalDateTime start = (watermark == null)
                ? end.minusDays(backfillDays)
                : watermark.minusMinutes(overlapMinutes);
        log.info("[EtaPro] EPLog incremental pull {} -> {} (watermark={})", start, end, watermark);
        return engine.executeBatch(Template.EPLOG, List.of(), start, end);
    }

    /** Pull an explicit window (used by manual refresh with a custom range / backfill). */
    public BatchResult pull(LocalDateTime start, LocalDateTime end) {
        log.info("[EtaPro] EPLog explicit pull {} -> {}", start, end);
        return engine.executeBatch(Template.EPLOG, List.of(), start, end);
    }
}
