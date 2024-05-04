package com.dk_power.power_plant_java.dto.permits;

import jakarta.persistence.Access;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@NoArgsConstructor
@AllArgsConstructor
@Data
public class LotoDto {
    private String requestor, controlAuthority,  system, workScope, equipment,createdBy;
    private Long id;

    public LotoDto(String requestor, String controlAuthority, String system, String workScope, String equipment, String createdBy) {
        this.requestor = requestor;
        this.controlAuthority = controlAuthority;
        this.system = system;
        this.workScope = workScope;
        this.equipment = equipment;
        this.createdBy = createdBy;
    }
}
