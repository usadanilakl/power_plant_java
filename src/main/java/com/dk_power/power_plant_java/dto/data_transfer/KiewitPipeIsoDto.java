package com.dk_power.power_plant_java.dto.data_transfer;

import com.dk_power.power_plant_java.dto.BaseDto;
import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Getter
@Setter
@NoArgsConstructor
public class KiewitPipeIsoDto extends BaseDto {
    private int lineNumber;
    private String description;
    private boolean sortableSize;
    private String system;
    private String pipeSpec;
    private String workingFluid;
    private String unit;
    private double designPressPsig;
    private double designTempF;
    private String schedule;
    private double maxOpPressPsig;
    private double normOpPressPsig;
    private double minOpPressPsig;
    private double testPressPsig;
    private String testMedium;
    private double maxOpTempF;
    private double normOpTempF;
    private double minOpTempF;
    private String insulationSpec;
    private double insulationThickness;
    private boolean heatTraced;
    private boolean cathodicProtection;
    private String comments;
    private String purchaseSpec;
    private String originalId;
    private String pAndId;
}
