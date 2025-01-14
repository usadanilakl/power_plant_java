package com.dk_power.power_plant_java.dto.data_service_project_dtos.equipment;

import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.base.DS_ConnectableDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.files.DS_FileElementDto;
import com.dk_power.power_plant_java.dto.permits.LotoPointDto;
import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

@Getter
@Setter
@SuperBuilder
@JsonIdentityInfo(
        generator = ObjectIdGenerators.PropertyGenerator.class,
        property = "id"
)
public class DS_EquipmentDto extends DS_ConnectableDto {
    public DS_EquipmentDto() {super();}

    private Set<DS_TagNumberDto> tagNumbers;
    private String description;
    private String specificLocation;
    private ValueDto location;
    private ValueDto system;
    private ValueDto equipmentType;
    private ValueDto vendor;
    private Map<String, String> attributes = new HashMap<>();
    private Set<ValueDto> tags = new HashSet<>();
    private Set<DS_FileElementDto> fileElements = new HashSet<>();
    private Set<DS_EquipmentConnectionDto> connectionsFrom = new HashSet<>();
    private Set<DS_EquipmentConnectionDto> connectionsTo = new HashSet<>();
    private Set<LotoPointDto> lotoPoints = new HashSet<>();

    @Override
    public String toString() {
        return "EquipmentDto{" +
                "id=" + getId() +
                "tagNumber='" + tagNumbers + '\'' +
                ", description='" + description + '\'' +
                ", specificLocation='" + specificLocation + '\'' +
                ", location=" + location +
                ", system=" + system +
                ", equipmentType=" + equipmentType +
                ", vendor=" + vendor +
                ", attributes=" + attributes +
                ", tags=" + tags +
                ", fileElements=" + fileElements +
                ", connectionsFrom=" + connectionsFrom +
                ", connectionsTo=" + connectionsTo +
                ", lotoPoints=" + lotoPoints +
                '}';
    }
}