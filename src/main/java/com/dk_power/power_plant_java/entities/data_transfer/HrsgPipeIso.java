package com.dk_power.power_plant_java.entities.data_transfer;

import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class HrsgPipeIso extends BaseIdEntity {
    private String rev;
    private String itemTagNumber;
    private String tagNumber;
    private String designation;
    private String pipeSpec;
    private String nominalSizeInch;
    private String outsideDiameterInch;
    private String thicknessInch;
    private String nominalSizeMm;
    private String outsideDiameterMm;
    private String thicknessMm;
    private String schedule;
    private String pipeMaterial;
    private String fluid;
    private String designPressPsig;
    private String designTempF;
    private String workPressPsig;
    private String workTempF;
    private String maxWorkTempF;
    private String tempForInsulationF;
    private String designPressBarg;
    private String designTempC;
    private String workPressBarg;
    private String workTempC;
    private String maxWorkTempC;
    private String tempForInsulationC;
    private String insulationType;
    private String insulationMaterial;
    private String insulationThicknessInch;
    private String insulationThicknessMm;
    private String heatTracing;
    private String hydrotestCircuitNumber;
    private String hydrotestPressurePsig;
    private String hydrotestPressureBarg;
    private String isometricNumber;
    private String remarks;
    private String pid;
    private String locationOnPid;
    private String originalId;
}
