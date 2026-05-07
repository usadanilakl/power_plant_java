package com.dk_power.power_plant_java.mappers.permits;

import com.dk_power.power_plant_java.dto.permits.WalkdownChecklistDto;
import com.dk_power.power_plant_java.entities.loto.WalkdownChecklist;
import org.springframework.stereotype.Component;

@Component
public class WalkdownChecklistMapper {

    public WalkdownChecklistDto convertToDto(WalkdownChecklist w) {
        if (w == null) return null;
        WalkdownChecklistDto dto = new WalkdownChecklistDto();
        dto.setId(w.getId());
        dto.setName(w.getName());
        dto.setObjectType(w.getObjectType());
        dto.setDateCreated(w.getDateCreated());
        dto.setDateModified(w.getDateModified());
        dto.setLotoId(w.getLoto() != null ? w.getLoto().getId() : null);
        dto.setLotoSnapshotId(w.getLotoSnapshot() != null ? w.getLotoSnapshot().getId() : null);
        dto.setRequestedBy(w.getRequestedBy());
        dto.setRequestedAt(w.getRequestedAt());
        dto.setCompletedBy(w.getCompletedBy());
        dto.setCompletedAt(w.getCompletedAt());
        dto.setCompleted(w.isCompleted());
        dto.setNotes(w.getNotes());
        dto.setPointStates(w.getPointStates());
        return dto;
    }
}
