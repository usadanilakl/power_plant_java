package com.dk_power.power_plant_java.mappers.permits;

import com.dk_power.power_plant_java.dto.permits.WalkdownSessionDto;
import com.dk_power.power_plant_java.entities.loto.WalkdownSession;
import org.springframework.stereotype.Component;

@Component
public class WalkdownSessionMapper {
    public WalkdownSessionDto toDto(WalkdownSession w) {
        if (w == null) return null;
        WalkdownSessionDto dto = new WalkdownSessionDto();
        dto.setId(w.getId());
        dto.setDeleted(w.getDeleted());
        dto.setCreatedBy(w.getCreatedBy());
        dto.setDateCreated(w.getDateCreated());
        dto.setDateModified(w.getDateModified());
        dto.setLotoId(w.getLoto() != null ? w.getLoto().getId() : null);
        dto.setCrewName(w.getCrewName());
        dto.setStartedBy(w.getStartedBy());
        dto.setStartedAt(w.getStartedAt());
        dto.setCompletedBy(w.getCompletedBy());
        dto.setCompletedAt(w.getCompletedAt());
        dto.setCompleted(w.isCompleted());
        dto.setSessionNotes(w.getSessionNotes());
        dto.setPointStates(w.getPointStates());
        return dto;
    }
}
