package com.dk_power.power_plant_java.sevice.etapro;

import com.dk_power.power_plant_java.entities.etapro.EtaProReading;
import com.dk_power.power_plant_java.sevice.etapro.EtaProScraperEngine.BatchResult;
import com.dk_power.power_plant_java.sevice.etapro.EtaProScraperEngine.Template;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Chooses the data source for a LIVE cycle: the EtaPRO REST API is the PRIMARY source when
 * {@code etapro.api.enabled=true} (one "current value" call per point via {@code archivevalue});
 * the Excel scraper's Live template is the fallback. Mirrors {@link EtaProHistoryFetchService}.
 *
 * <p>The {@link EtaProApiService} bean only exists when the API is enabled, so it is injected as an
 * {@link Optional} — absent means scraper-only.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "etapro.enabled", havingValue = "true", matchIfMissing = false)
public class EtaProLiveFetchService {

    private final EtaProScraperEngine engine;
    private final Optional<EtaProApiService> apiService;

    /** When true, an API failure is NOT retried via the scraper (API-only). Default: fall back. */
    @Value("${etapro.api.strict:false}")
    private boolean strict;

    /** Window (seconds back from now) used only by the Excel Live fallback template. */
    @Value("${etapro.live.window.seconds:15}")
    private int liveWindowSeconds;

    /**
     * Fetch + persist the current value of each point in the chunk. Tries the API first (if enabled),
     * else/on-failure the scraper's Live template.
     */
    public BatchResult fetchLiveBatch(List<String> pointIds) {
        if (apiService.isPresent()) {
            String sessionId = UUID.randomUUID().toString();
            try {
                List<EtaProReading> readings = apiService.get().fetchCurrent(pointIds, sessionId);
                int imported = engine.saveReadings(readings);
                String msg = imported + "/" + readings.size() + " live via API";
                log.debug("[EtaPro] Live batch via API: {} pts, {}", pointIds.size(), msg);
                return new BatchResult(true, msg, readings.size(), imported, sessionId);
            } catch (Exception e) {
                log.warn("[EtaPro] API live fetch failed ({} pts): {}", pointIds.size(), e.getMessage());
                if (strict) {
                    return BatchResult.failure("API live fetch failed (strict, no fallback): " + e.getMessage(), sessionId);
                }
                log.info("[EtaPro] Falling back to Excel scraper for this live batch");
                // fall through to scraper
            }
        }
        LocalDateTime end = LocalDateTime.now();
        LocalDateTime start = end.minusSeconds(liveWindowSeconds);
        return engine.executeBatch(Template.LIVE, pointIds, start, end);
    }
}
