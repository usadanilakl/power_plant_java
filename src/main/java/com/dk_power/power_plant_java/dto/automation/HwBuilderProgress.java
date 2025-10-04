package com.dk_power.power_plant_java.dto.automation;

import com.dk_power.power_plant_java.dto.permits.HotWorkDto;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HwBuilderProgress extends FormBuilderProgress{
    private HotWorkDto hotWorkDto;
}
