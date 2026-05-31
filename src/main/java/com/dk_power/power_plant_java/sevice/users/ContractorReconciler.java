package com.dk_power.power_plant_java.sevice.users;

import com.dk_power.power_plant_java.clients.OnLocationClient;
import com.dk_power.power_plant_java.dto.users.ContractorDto;
import com.dk_power.power_plant_java.entities.users.ContractorChangeReport;
import com.dk_power.power_plant_java.config.SyncConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Pulls the OnLocation contractor roster and produces a PENDING change report
 * whenever the live data drifts from the local Contractor-tagged User rows.
 *
 * Hub-only. Other deployments early-return — the scheduler still runs on every
 * Spring instance, so the guard keeps work confined to the hub.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ContractorReconciler {

    private final SyncConfig syncConfig;
    private final ContractorSyncService contractorSyncService;
    /** OnLocationClient is {@code @ConditionalOnProperty} — absent on installs without the key. */
    private final ObjectProvider<OnLocationClient> onLocationClientProvider;

    /** Nightly contractor scan. Configurable via {@code contractor.reconcile.interval-ms} (default 24h). */
    @Scheduled(fixedDelayString = "${contractor.reconcile.interval-ms:86400000}", initialDelay = 300_000)
    public void scheduledScan() {
        if (!syncConfig.isHubMode()) return;
        try {
            scan("scheduled");
        } catch (Exception e) {
            log.error("[Contractors] Scheduled reconcile failed: {}", e.getMessage(), e);
        }
    }

    /**
     * Manual scan trigger. Returns the persisted PENDING report. Throws when
     * OnLocation is not configured so the caller surfaces the error to the
     * admin instead of producing an empty report.
     */
    public ContractorChangeReport scanNow() {
        return scan("manual");
    }

    private ContractorChangeReport scan(String source) {
        OnLocationClient client = onLocationClientProvider.getIfAvailable();
        if (client == null) {
            throw new IllegalStateException("OnLocation client is not configured (set onlocation.api.key)");
        }
        List<ContractorDto> live = client.getContractors();
        ContractorChangeReport report = contractorSyncService.buildReport(live, "onlocation-" + source);
        log.info("[Contractors] {} reconcile -> report #{}: {}", source, report.getId(), report.getSummary());
        return report;
    }
}
