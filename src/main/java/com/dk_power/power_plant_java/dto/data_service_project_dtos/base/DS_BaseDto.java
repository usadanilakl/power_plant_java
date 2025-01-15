package com.dk_power.power_plant_java.dto.data_service_project_dtos.base;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
public class DS_BaseDto {

    private UUID id;
    private String name;
    private String objectType;
    private String note;

    private Long oldPidProjectItemId;
    private String refactorNotes;

    @Builder.Default
    @JsonIgnore
    List<String> skipMappingFields = new ArrayList<>();
}
