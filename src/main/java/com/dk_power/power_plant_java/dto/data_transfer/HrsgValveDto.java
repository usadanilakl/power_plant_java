package com.dk_power.power_plant_java.dto.data_transfer;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Getter
@Setter
@NoArgsConstructor
public class HrsgValveDto extends BaseDto {
    private String tagNumber;
    private String designation;
    private String inletPipeTag;
    private String outletPipeTag;
    private String fluid;
    private String actType;
    private String failSafePosition;
    private String nominalPipeSizeIn;
    private String nominalPipeSizeOut;
    private String valveType;
//    private String pipeMaterialIn;
//    private String pipeMaterialOut;
//    private String vlvMaterial;
    private String mawpPsig;
    private String designTempF;
//    private double mawpBarg;
//    private double designTempC;
//    private String valveClassIn;
//    private String valveClassOut;
//    private String pipeEndIn;
//    private String pipeEndOut;
    private String remarks;
//    private double hydrotestPressurePsig;
//    private double hydrotestPressureBarg;
//    private String hydrotestNumber;
//    private String cavityOverPressureProtection;
//    private String supplier;
    private String johnCockerillValveDrawingNumber;
//    private String wbsNumber;
//    private String originalId;
    private String johnCockerillPidNumber;
}
