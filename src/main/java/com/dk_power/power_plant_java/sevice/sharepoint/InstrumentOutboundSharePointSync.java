package com.dk_power.power_plant_java.sevice.sharepoint;

import com.dk_power.power_plant_java.dto.instrumentation.InstrumentDto;
import com.dk_power.power_plant_java.dto.instrumentation.InstrumentLogDto;
import com.dk_power.power_plant_java.entities.instrumentation.Instrument;
import com.dk_power.power_plant_java.entities.instrumentation.InstrumentLog;
import com.dk_power.power_plant_java.mappers.instrumentation.InstrumentLogMapper;
import com.dk_power.power_plant_java.mappers.instrumentation.InstrumentMapper;
import com.dk_power.power_plant_java.repository.instrumentation.InstrumentLogRepo;
import com.dk_power.power_plant_java.repository.instrumentation.InstrumentRepo;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.InstrumentLogSharePointAdapter;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.InstrumentSharePointAdapter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

/**
 * Catches up instruments and logs that were saved locally but never reached SharePoint.
 *
 * <p>Both instrument syncables are <b>pull-only</b>: they import SharePoint changes but never push
 * local rows out. Submission does the outbound write inline and treats a SharePoint failure as
 * non-fatal ("saved locally, method=local"), which is the right call for the caller — the log is
 * safe — but left a permanent gap: nothing ever retried, so a transient SharePoint outage stranded
 * that row in H2 for good. Worse, a device re-submitting the same {@code localUuid} got
 * {@code duplicate(success=true)} back and cleared it from its outbox, so the retry that would have
 * fixed it never happened either.</p>
 *
 * <p>Mirrors {@link SdsOutboundSharePointSync} / {@link SdsAuditOutboundSharePointSync}: hub-only,
 * bounded per run, and driven entirely by {@code sharepointId IS NULL} so it is naturally idempotent
 * — once a row lands, it stops being a candidate.</p>
 */
@Slf4j
@Service
@ConditionalOnProperty(name = "sync.role", havingValue = "hub")
@RequiredArgsConstructor
public class InstrumentOutboundSharePointSync {

    private static final int MAX_PER_RUN = 50;

    private final InstrumentRepo instrumentRepo;
    private final InstrumentLogRepo instrumentLogRepo;
    private final InstrumentMapper instrumentMapper;
    private final InstrumentLogMapper logMapper;
    private final InstrumentSharePointAdapter instrumentAdapter;
    private final InstrumentLogSharePointAdapter logAdapter;

    /**
     * Instruments first, then logs — a log's SharePoint row is far more useful next to a register
     * entry that exists, and the register write is what the log's own lookup keys off.
     */
    @Scheduled(initialDelay = 45_000, fixedDelay = 60_000)
    public void pushUnsynced() {
        pushInstruments();
        pushLogs();
    }

    private void pushInstruments() {
        List<Instrument> pending;
        try {
            pending = instrumentRepo.findBySharepointIdIsNull();
        } catch (Exception e) {
            log.warn("[Instrument Outbound] Could not load unsynced instruments: {}", e.getMessage());
            return;
        }
        if (pending == null || pending.isEmpty()) return;

        int pushed = 0;
        for (Instrument entity : pending) {
            if (pushed >= MAX_PER_RUN) break;
            // A tagless row can't be created in SharePoint — Tag Number is the list's unique key.
            if (entity.getTagNumber() == null || entity.getTagNumber().isBlank()) continue;
            try {
                if (entity.getLocalUuid() == null || entity.getLocalUuid().isBlank()) {
                    entity.setLocalUuid(UUID.randomUUID().toString());
                }
                InstrumentDto dto = instrumentMapper.convertToDto(entity);
                String spId = instrumentAdapter.create(dto);
                if (spId != null) {
                    entity.setSharepointId(spId);
                    instrumentRepo.save(entity);
                    pushed++;
                }
            } catch (Exception e) {
                log.warn("[Instrument Outbound] Push failed for id={} tagNumber={}: {}",
                        entity.getId(), entity.getTagNumber(), e.getMessage());
            }
        }
        if (pushed > 0) log.info("[Instrument Outbound] Pushed {} instrument(s) to SharePoint", pushed);
    }

    private void pushLogs() {
        List<InstrumentLog> pending;
        try {
            pending = instrumentLogRepo.findBySharepointIdIsNull();
        } catch (Exception e) {
            log.warn("[Instrument Outbound] Could not load unsynced logs: {}", e.getMessage());
            return;
        }
        if (pending == null || pending.isEmpty()) return;

        int pushed = 0;
        for (InstrumentLog entity : pending) {
            if (pushed >= MAX_PER_RUN) break;
            try {
                if (entity.getLocalUuid() == null || entity.getLocalUuid().isBlank()) {
                    entity.setLocalUuid(UUID.randomUUID().toString());
                }
                InstrumentLogDto dto = logMapper.convertToDto(entity);
                String spId = logAdapter.create(dto);
                if (spId != null) {
                    entity.setSharepointId(spId);
                    instrumentLogRepo.save(entity);
                    pushed++;
                }
            } catch (Exception e) {
                log.warn("[Instrument Outbound] Log push failed for id={} tagNumber={}: {}",
                        entity.getId(), entity.getInstrumentTagNumber(), e.getMessage());
            }
        }
        if (pushed > 0) log.info("[Instrument Outbound] Pushed {} log(s) to SharePoint", pushed);
    }
}
