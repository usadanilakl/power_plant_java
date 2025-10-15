package com.dk_power.power_plant_java.dto.permits;

import com.dk_power.power_plant_java.dto.base_dtos.BasePermitIdDto;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
@Getter
@Setter
public class LotoIdDto extends BasePermitIdDto {
    private List<Long> lotoPoints;

    private List<Long> locks;

    private Long lotoBox;
    private String equipmentSystem;
    private String lotoRequestor;
    private String date;
    private Integer boxNumber;
}
