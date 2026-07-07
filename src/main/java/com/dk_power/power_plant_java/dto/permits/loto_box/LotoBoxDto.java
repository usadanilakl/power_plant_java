package com.dk_power.power_plant_java.dto.permits.loto_box;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.dto.esp.LedStripDto;
import com.dk_power.power_plant_java.dto.permits.LockDto;
import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

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

    private Integer setSize = 0;
    private Boolean active = true;
    private Boolean portable = false;
    private Boolean manualOverride = false;

    private List<LockDto> homeLocks = new ArrayList<>();

    // Flat display fields for the assigned LOTO (loto field above is JsonBackReference and not serialized).
    private Long lotoId;
    private String lotoPermitNumber;
    private String lotoEquipmentSystem;
    private String lotoStatus;
    private String lotoWorkScope;
}
