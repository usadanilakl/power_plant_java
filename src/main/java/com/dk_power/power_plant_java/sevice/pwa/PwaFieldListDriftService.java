package com.dk_power.power_plant_java.sevice.pwa;

import com.dk_power.power_plant_java.dto.pwa.PwaFieldListDriftStatusDto;
import com.dk_power.power_plant_java.entities.field_list.FieldListItem;
import com.dk_power.power_plant_java.entities.sync.DriftPeer;
import com.dk_power.power_plant_java.entities.sync.DriftRecord;
import com.dk_power.power_plant_java.entities.sync.DriftStatus;
import com.dk_power.power_plant_java.repository.field_list.FieldListItemRepo;
import com.dk_power.power_plant_java.repository.sync.DriftRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Compact drift-status feed for the PWA (field-list list view + insulation contractor view).
 * Read-only: PWA users see a badge so they can escalate to admin, but resolution lives in
 * the JG Portal admin drift panel. Aggregates:
 * <ul>
 *   <li>HUB drift (DriftRecord peer=HUB, active) from the content-hash oracle</li>
 *   <li>SP drift (DriftRecord peer=SHAREPOINT, active) — row-presence</li>
 *   <li>Maximo pending flags (bridge submit/cancel/complete failed and awaiting backfill)</li>
 *   <li>Maximo divergence (Maximo terminal / local open — and inverse)</li>
 * </ul>
 * Bulk-lookup: single query per source rather than N per id.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PwaFieldListDriftService {

    private static final String ENTITY_TYPE = "FieldListItem";
    private static final Set<DriftStatus> ACTIVE = Set.of(DriftStatus.FLAGGED, DriftStatus.ACKNOWLEDGED);
    private static final Set<String> MAXIMO_TERMINAL = Set.of("CANCELLED", "CLOSED", "COMP", "CLOSE", "CAN");
    private static final Set<String> MAXIMO_WO_OPEN = Set.of("WAPPR", "APPR", "WSCH", "INPRG");
    private static final Set<String> LOCAL_OPEN = Set.of("Open", "In Progress");
    private static final String LOCAL_CLOSED = "Closed";

    private final DriftRecordRepository driftRepo;
    private final FieldListItemRepo fieldListRepo;

    /**
     * Return drift status for the given row IDs. IDs not found → absent from the map (client
     * treats missing as "no drift"). Never throws — a missing DriftRecord row is expected
     * (means no drift), and an unknown FieldListItem id just means it's not in the list.
     */
    public Map<Long, PwaFieldListDriftStatusDto> statusFor(Collection<Long> ids) {
        if (ids == null || ids.isEmpty()) return Map.of();
        Map<Long, PwaFieldListDriftStatusDto> out = new HashMap<>();
        // Prime the map so the client can always look up the requested id (empty status = clean).
        for (Long id : ids) if (id != null) out.putIfAbsent(id, blank());

        // Sync drift (HUB + SP) — one query per active-status set, filtered by id in-memory
        // (drift records are sparse; a full active scan for the type is small).
        List<DriftRecord> active = driftRepo.findByEntityTypeAndStatusIn(ENTITY_TYPE, ACTIVE);
        Set<Long> requested = Set.copyOf(ids);
        for (DriftRecord r : active) {
            Long id = r.getEntityId();
            if (id == null || !requested.contains(id) || !DriftRecord.ROW.equals(r.getFieldName())) continue;
            PwaFieldListDriftStatusDto d = out.computeIfAbsent(id, k -> blank());
            if (r.getPeer() == DriftPeer.HUB) d.setHubDrift(true);
            else if (r.getPeer() == DriftPeer.SHAREPOINT) d.setSpDrift(true);
        }

        // Maximo pending + divergence — pull the entities and read the flags in Java. Skips
        // ids that don't exist (map defaults to blank so nothing bad happens on the wire).
        List<FieldListItem> rows = fieldListRepo.findAllById(ids);
        for (FieldListItem r : rows) {
            if (r == null || r.getId() == null) continue;
            PwaFieldListDriftStatusDto d = out.computeIfAbsent(r.getId(), k -> blank());
            boolean pending = Boolean.TRUE.equals(r.getMaximoSyncPending())
                    || Boolean.TRUE.equals(r.getMaximoCancelPending())
                    || Boolean.TRUE.equals(r.getMaximoCompletePending());
            d.setMaximoPending(pending);
            String maxStatus = r.getMaximoStatus();
            String localStatus = r.getStatus() == null ? null : r.getStatus().getName();
            if (maxStatus != null && MAXIMO_TERMINAL.contains(maxStatus)
                    && localStatus != null && LOCAL_OPEN.contains(localStatus)) {
                d.setMaximoClosedLocalOpen(true);
            }
            if ("WO".equals(r.getMaximoRecordType()) && maxStatus != null && MAXIMO_WO_OPEN.contains(maxStatus)
                    && LOCAL_CLOSED.equals(localStatus)) {
                d.setLocalClosedMaximoOpen(true);
            }
        }
        return out;
    }

    private static PwaFieldListDriftStatusDto blank() {
        return new PwaFieldListDriftStatusDto(false, false, false, false, false);
    }
}
