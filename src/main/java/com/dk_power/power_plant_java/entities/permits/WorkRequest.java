package com.dk_power.power_plant_java.entities.permits;

import com.dk_power.power_plant_java.entities.base_entities.BasePermitEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "work_request")
@Getter
@Setter
public class WorkRequest extends BasePermitEntity {

    private String dateOfWorkToBePerformed;
    private String timeOfWorkToBePerformed;
    private String requestedBy;
    private String company;
    private String location;
    private String affectedEquipment;
    private String workScope;

    private Boolean isHotWorkRequired;
    private String foreman;
    private String fireWatch;

    private Boolean isLotoRequired;
    private Boolean isConfinedSpaceEntryRequired;
    private String space;
}
