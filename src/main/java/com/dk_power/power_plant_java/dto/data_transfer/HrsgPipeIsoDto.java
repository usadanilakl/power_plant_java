package com.dk_power.power_plant_java.dto.data_transfer;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Getter
@Setter
@NoArgsConstructor
public class HrsgPipeIsoDto extends BaseDto {
    private String rev;
    private String itemTag;
    private String lineTag;
    private String designation;
    private String pipeSpec;
    private double nominalSizeInch;
    private double outsideDiameterInch;
    private double thicknessInch;
    private double nominalSizeMm;
    private double outsideDiameterMm;
    private double thicknessMm;
    private String schedule;
    private String pipeMaterial;
    private String fluid;
    private double designPressPsig;
    private double designTempF;
    private double workPressPsig;
    private double workTempF;
    private double maxWorkTempF;
    private double tempForInsulationF;
    private double designPressBarg;
    private double designTempC;
    private double workPressBarg;
    private double workTempC;
    private double maxWorkTempC;
    private double tempForInsulationC;
    private String insulationType;
    private String insulationMaterial;
    private double insulationThicknessInch;
    private double insulationThicknessMm;
    private boolean heatTracing;
    private String hydrotestCircuitNumber;
    private double hydrotestPressurePsig;
    private double hydrotestPressureBarg;
    private String isometricNumber;
    private String remarks;
    private String pidNumber;
    private String locationOnPid;
    private String originalId;
}
