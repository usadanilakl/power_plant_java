package com.dk_power.power_plant_java.dto.sync;

import com.dk_power.power_plant_java.entities.sync.FieldChange;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FieldChangeDto {
    private String fieldName;
    private String oldValue;
    private String newValue;
    private Instant timestamp;
    private String originMachineId;
    private String originMachineName;
    private String changeType;
    private String relationshipType;

    public static FieldChangeDto from(FieldChange fc) {
        return new FieldChangeDto(
            fc.getFieldName(),
            fc.getOldValue(),
            fc.getNewValue(),
            fc.getTimestamp(),
            fc.getOriginMachineId(),
            fc.getOriginMachineName(),
            fc.getChangeType().name(),
            fc.getRelationshipType()
        );
    }
}
