package com.dk_power.power_plant_java.dto.automation;

import com.dk_power.power_plant_java.dto.permits.SafeWorkDto;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SwBuilderProgress  extends FormBuilderProgress{
    private SafeWorkDto safeWorkDto;
}
