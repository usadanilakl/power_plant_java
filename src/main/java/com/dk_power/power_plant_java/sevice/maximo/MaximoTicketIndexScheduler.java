package com.dk_power.power_plant_java.sevice.maximo;

import com.dk_power.power_plant_java.config.SyncConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Periodically refreshes the Maximo ticket→asset index on the HUB only. One authority computes the index
 * and it syncs to every desktop (like the recurring-PM catalog and SharePoint orchestrator), so desktops
 * never hit Maximo for this or duplicate the work. The one-time full backfill is triggered manually via the
 * admin endpoint; this timer only runs the light incremental (tickets changed since the last run).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MaximoTicketIndexScheduler {

    private final MaximoTicketIndexService ticketIndex;
    private final SyncConfig syncConfig;

    @Scheduled(fixedDelayString = "${maximo.ticket-index.interval-ms:21600000}",   // default every 6h
               initialDelayString = "${maximo.ticket-index.initial-delay-ms:300000}") // 5 min after startup
    public void periodicIncremental() {
        if (!syncConfig.isHubMode()) return;   // hub is the single authority for the shared index
        try {
            ticketIndex.incremental(false);
        } catch (Exception e) {
            log.warn("[TicketIndex] scheduled incremental failed: {}", e.getMessage());
        }
    }
}
