package com.dk_power.power_plant_java.dto.data_transfer;

import com.dk_power.power_plant_java.dto.BaseDto;
import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Getter
@Setter
@NoArgsConstructor
public class OldLotoPointDto extends BaseDto {
    private String recId;
    private String status;
    private String isolationDeviceDescription;
    private String isolationDevicePnId;
    private String isolationDeviceLocation;
    private String defaultIsolatedPosition;
    private String normalPosition;
}
