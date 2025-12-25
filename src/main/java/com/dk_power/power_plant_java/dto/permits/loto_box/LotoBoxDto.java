package com.dk_power.power_plant_java.dto.permits.loto_box;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.dto.esp.LedStripDto;
import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Setter
@Getter
@JsonIdentityInfo(
        generator = ObjectIdGenerators.PropertyGenerator.class,
        property = "id")
public class LotoBoxDto extends BaseDto {
    private Integer number = 0;
    @JsonBackReference
    private LotoDto loto;
    private ValueDto lotoAccessoryStatus;
    
    // LED Configuration fields
    private Long ledStripId;
    private LedStripDto ledStrip;
    
    private Integer rangeStart;
    private Integer rangeEnd;

    private String description;

    // Current LED color state (from database)
    private Integer r;
    private Integer g;
    private Integer b;
    private Integer brightness;

}
