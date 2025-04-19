package com.dk_power.power_plant_java.dto.base_dtos;


import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
import com.dk_power.power_plant_java.dto.users.UserDto;
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
public class BasePermitDto extends BaseDto {
    private String workScope;
    private ValueDto system;
    private Set<EquipmentDto> equipment = new HashSet<>();
    private UserDto requestor;
    private UserDto controlAuthority;
    private ValueDto type;
    private Long docNum;
    private ValueDto permitStatus;
    private Boolean temp;
}