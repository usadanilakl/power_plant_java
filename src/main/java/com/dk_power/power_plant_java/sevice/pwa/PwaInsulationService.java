package com.dk_power.power_plant_java.sevice.pwa;

import com.dk_power.power_plant_java.dto.pwa.PwaInsulationItemDto;
import com.dk_power.power_plant_java.entities.field_list.FieldListItem;
import com.dk_power.power_plant_java.repository.field_list.FieldListItemRepo;
import com.dk_power.power_plant_java.sevice.maximo.MaximoFieldListBridge;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Insulation-contractor-facing service. Reads active insulation-typed field lists (routed to
 * Maximo as WOs) and lets the contractor close the WO directly when work is done. Distinct
 * from {@link PwaFieldListItemService} which handles the plant-submitter path — contractors
 * NEVER create field lists here, they only work down the active queue.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class PwaInsulationService {

    /**
     * FieldListType name that this service is scoped to. Hard-coded rather than config-driven
     * because the "Insulation" role and the "Insulation Removal" type are conceptually paired —
     * changing the type name is a UX rename, not a routing question. Match must be exact for
     * findActiveWoByListType.
     */
    private static final String INSULATION_LIST_TYPE = "Insulation Removal";

    /**
     * Non-terminal WO statuses considered "still needs work". Excludes COMP/CLOSE/CAN so a
     * closed row stops appearing in the contractor's queue immediately after the bridge
     * updates local state.
     */
    private static final List<String> OPEN_WO_STATUSES = List.of("WAPPR", "APPR", "WSCH", "INPRG");

    private final FieldListItemRepo repo;
    private final Optional<MaximoFieldListBridge> maximoBridge;

    /** Active insulation WOs across the whole plant, newest-first. Contractors work down this list. */
    public List<PwaInsulationItemDto> listActive() {
        return repo.findActiveWoByListType(INSULATION_LIST_TYPE, OPEN_WO_STATUSES)
                .stream()
                .map(PwaInsulationService::toDto)
                .toList();
    }

    /**
     * Contractor marks the item done → COMPs the Maximo WO. Best-effort with a clear boolean
     * result: caller (controller) surfaces "already closed" vs "closed just now" vs "Maximo
     * failed, will retry" as distinct UX states. Returns false only when the row isn't a
     * WO-routed insulation item OR the bridge is absent (feature off) — Maximo API failures
     * are logged inside {@link MaximoFieldListBridge#complete} but surface as false too.
     */
    public boolean markComplete(Long id, String submitterHandle) {
        FieldListItem entity = repo.findById(id).orElse(null);
        if (entity == null) {
            log.warn("[PwaInsulation] markComplete: id={} not found", id);
            return false;
        }
        if (entity.getListType() == null || !INSULATION_LIST_TYPE.equalsIgnoreCase(entity.getListType().getName())) {
            log.warn("[PwaInsulation] markComplete: id={} is not an insulation item (listType={})",
                    id, entity.getListType() == null ? null : entity.getListType().getName());
            return false;
        }
        if (!MaximoFieldListBridge.REC_TYPE_WO.equals(entity.getMaximoRecordType())) {
            log.warn("[PwaInsulation] markComplete: id={} is not WO-routed (recordType={})",
                    id, entity.getMaximoRecordType());
            return false;
        }
        String memo = "Completed by " + (submitterHandle == null || submitterHandle.isBlank()
                ? "insulation contractor" : submitterHandle);
        return maximoBridge.map(b -> b.complete(entity, memo)).orElse(false);
    }

    private static PwaInsulationItemDto toDto(FieldListItem e) {
        PwaInsulationItemDto d = new PwaInsulationItemDto();
        d.setId(e.getId());
        d.setTitle(e.getTitle());
        d.setNotes(e.getNotes());
        d.setSpecificLocation(e.getSpecificLocation());
        d.setLocationName(e.getLocation() == null ? null : e.getLocation().getName());
        d.setEquipmentTag(e.getEquipment() == null ? null : e.getEquipment().getTagNumber());
        d.setSubmitterName(e.getSubmitterName());
        d.setDateObserved(e.getDateObserved());
        d.setTimeObserved(e.getTimeObserved());
        d.setMaximoWonum(e.getMaximoRecordId());
        d.setMaximoStatus(e.getMaximoStatus());
        return d;
    }
}
