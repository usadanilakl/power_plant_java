package com.dk_power.power_plant_java.dto.permits;

import com.dk_power.power_plant_java.dto.base_dtos.BasePermitDto;
import com.dk_power.power_plant_java.dto.permits.loto_box.LotoBoxDto;
import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointIdDto;
import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@JsonIdentityInfo(
        generator = ObjectIdGenerators.PropertyGenerator.class,
        property = "id")
@NoArgsConstructor
public class LotoDto extends BasePermitDto {

    private List<LotoPointIdDto> lotoPoints;

    private List<LockDto> locks;

    private LotoBoxDto lotoBox;

    private List<LotoSnapshotDto> snapshots;
    private String equipmentSystem;
    private String lotoRequestor;
    private String date;
    private Integer boxNumber;
    private Boolean wasModifiedDuringActive;
    private String closeDisposition;
}