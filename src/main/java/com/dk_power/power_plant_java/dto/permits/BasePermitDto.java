package com.dk_power.power_plant_java.dto.permits;

import com.dk_power.power_plant_java.enums.PermitType;
import com.dk_power.power_plant_java.enums.Status;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@NoArgsConstructor
@AllArgsConstructor
@Data
public abstract class BasePermitDto {
    private String workScope;
    private String system;
    private String equipment;
    private String requestor;
    private String controlAuthority;
    private PermitType type;
    private Long docNum;
    private Status status;
    private String createdBy;
    private Long id;
    private Boolean temp;
    private Boolean deleted;



}
