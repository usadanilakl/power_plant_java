package com.dk_power.power_plant_java.dto.equipment;

import com.dk_power.power_plant_java.dto.base_dtos.BaseEquipmentDto;
import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.entities.base_entities.BaseEquipment;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.equipment.HtBreaker;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@JsonIdentityInfo(generator = ObjectIdGenerators.PropertyGenerator.class, property = "id")

public class HeatTraceDto extends BaseEquipmentDto {
    private HtBreakerDto breaker;
    @JsonBackReference
    private List<EquipmentDto> equipmentList;
    @JsonBackReference
    private FileDto htIso;
    @JsonBackReference
    private List<FileDto> pid;
    @JsonManagedReference
    private LotoPoint lotoPoint;
}
