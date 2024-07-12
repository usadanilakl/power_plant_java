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
public class HrsgValve extends BaseIdEntity {
    private String itemTag;
    private String designation;
    private String inletPipeTag;
    private String outletPipeTag;
    private String fluid;
    private String actType;
    private String failSafePosition;
    private String nominalPipeSizeIn;
    private String nominalPipeSizeOut;
    private String valveType;
    private String pipeMaterialIn;
    private String pipeMaterialOut;
    private String vlvMaterial;
    private String mawpPsig;
    private String designTempF;
    private String mawpBarg;
    private String designTempC;
    private String valveClassIn;
    private String valveClassOut;
    private String pipeEndIn;
    private String pipeEndOut;
    @Column(length = 1000)
    private String remarks;
    private String hydrotestPressurePsig;
    private String hydrotestPressureBarg;
    private String hydrotestNumber;
    private String cavityOverPressureProtection;
    private String supplier;
    private String johnCockerillValveDrawingNumber;
    private String wbsNumber;
    private String originalId;
    private String johnCockerillPidNumber;
}
