package com.dk_power.power_plant_java.dto.data_transfer;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Getter
@Setter
@NoArgsConstructor
public class OldLotoPointDto extends BaseDto {
//    private String recId;
//    private String status;


    private String isoPos;
    private String tagNumber;
    private String location;
    private String defaultIsolatedPosition;
    private String normalPos;
}
