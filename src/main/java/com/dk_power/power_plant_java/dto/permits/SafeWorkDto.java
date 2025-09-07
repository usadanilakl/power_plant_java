package com.dk_power.power_plant_java.dto.permits;

import com.dk_power.power_plant_java.dto.base_dtos.BasePermitDto;
import com.dk_power.power_plant_java.entities.permits.pojo.SwHazards;
import com.dk_power.power_plant_java.entities.permits.pojo.SwPermits;
import com.dk_power.power_plant_java.entities.permits.pojo.SwPpe;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public class SafeWorkDto extends BasePermitDto {

    private String date;
    private String time;
    private String companyPerson;
    private String location;
    private String workScope;
    private String specialInstructions;
    private String requestor;

    private SwHazards hazards;
    private SwPermits permits;
    private SwPpe ppe;

}
