package com.dk_power.power_plant_java.dto.permits;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.enums.Status;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Setter
@Getter
@JsonIdentityInfo(
        generator = ObjectIdGenerators.PropertyGenerator.class,
        property = "id")
public class LockDto extends BaseDto {
    private Integer number = 0;
    @JsonBackReference
    private LotoDto loto;
    private ValueDto lotoAccessoryStatus;
    private Long id;

    private String tagLabel;
    private Long assignedLotoPointId;
    private String lockType;
    private Integer homeBoxNumber;
    private Boolean isSingleLock;

    // Flat display fields for the assigned LOTO (loto field above is JsonBackReference and not serialized).
    private Long lotoId;
    private String lotoPermitNumber;
    private Long lotoDocNum;
}
