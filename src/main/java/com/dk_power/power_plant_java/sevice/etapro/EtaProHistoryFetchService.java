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
 * Chooses the data source for a history batch: the EtaPRO REST API is the PRIMARY source when
 * {@code etapro.api.enabled=true}; the Excel scraper is the fallback (and remains the source for
 * Live). If the API call fails and {@code etapro.api.strict=false} (default), it silently falls
 * back to the scraper so history keeps flowing.
 *
 * <p>The {@link EtaProApiService} bean only exists when the API is enabled, so it is injected as an
 * {@link Optional} — absent means scraper-only.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "etapro.enabled", havingValue = "true", matchIfMissing = false)
public class EtaProHistoryFetchService {

    private final EtaProScraperEngine engine;
    private final Optional<EtaProApiService> apiService;

    /** When true, an API failure is NOT retried via the scraper (API-only). Default: fall back. */
    @Value("${etapro.api.strict:false}")
    private boolean strict;

    /**
     * Fetch + persist one history batch. Tries the API first (if enabled), else/on-failure the scraper.
     */
    public BatchResult fetchHistoryBatch(List<String> pointIds, LocalDateTime start, LocalDateTime end) {
        if (apiService.isPresent()) {
            String sessionId = UUID.randomUUID().toString();
            try {
                List<EtaProReading> readings = apiService.get().fetchHistory(pointIds, start, end, sessionId);
                int imported = engine.saveReadings(readings);
                String msg = imported + "/" + readings.size() + " imported via API";
                log.debug("[EtaPro] History batch via API: {} pts, {}", pointIds.size(), msg);
                return new BatchResult(true, msg, readings.size(), imported, sessionId);
            } catch (Exception e) {
                log.warn("[EtaPro] API history fetch failed ({} pts): {}", pointIds.size(), e.getMessage());
                if (strict) {
                    return BatchResult.failure("API history fetch failed (strict, no fallback): " + e.getMessage(), sessionId);
                }
                log.info("[EtaPro] Falling back to Excel scraper for this history batch");
                // fall through to scraper
            }
        }
        return engine.executeBatch(Template.HISTORY, pointIds, start, end);
    }
}
