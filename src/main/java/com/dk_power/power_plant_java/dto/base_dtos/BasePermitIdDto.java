package com.dk_power.power_plant_java.dto.base_dtos;

import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
import com.dk_power.power_plant_java.dto.users.UserDto;
import lombok.Getter;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
public class BasePermitIdDto extends BaseDto{
    private String workScope;
    private Long system;
    private Set<Long> equipment = new HashSet<>();
    private Long requestor;
    private Long controlAuthority;
    private Long permitType;
    private Long docNum;
    private Long permitStatus;
    private Boolean temp;
}
