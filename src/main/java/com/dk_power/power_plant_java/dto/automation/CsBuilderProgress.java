package com.dk_power.power_plant_java.dto.automation;

import com.dk_power.power_plant_java.dto.permits.ConfinedSpaceDto;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CsBuilderProgress extends FormBuilderProgress {
    private ConfinedSpaceDto confinedSpaceDto;
}
