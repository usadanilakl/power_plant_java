package com.dk_power.power_plant_java.dto.base_dtos;


import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
import com.dk_power.power_plant_java.dto.permits.WorkAreaDto;
import com.dk_power.power_plant_java.dto.users.UserDto;
import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.Set;
import java.util.HashSet;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonIdentityInfo(
        generator = ObjectIdGenerators.PropertyGenerator.class,
        property = "id")
public class BasePermitDto extends BaseDto {
    private String workScope;
//    @JsonIgnore
    private ValueDto system;
    @JsonIgnore
    private Set<EquipmentDto> equipment = new HashSet<>();
//    @JsonIgnore
    private UserDto requestor;
//    @JsonIgnore
    private UserDto controlAuthority;
//    @JsonIgnore
    private ValueDto permitType;
    private Long docNum;
//    @JsonIgnore
    private ValueDto permitStatus;
    private Boolean temp;
    private String redTagNum;
    private WorkAreaDto workArea;
}