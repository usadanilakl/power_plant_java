package com.dk_power.power_plant_java.dto.permits;

import lombok.Data;
import lombok.NoArgsConstructor;


@NoArgsConstructor
@Data
public class LotoDto {
    private String requestor, controlAuthority,  system, workScope, equipment,createdBy;

    public LotoDto(String requestor, String controlAuthority, String createdBy, String system, String workScope, String equipment) {
        this.requestor = requestor;
        this.controlAuthority = controlAuthority;
        this.system = system;
        this.workScope = workScope;
        this.equipment = equipment;
    }

}
