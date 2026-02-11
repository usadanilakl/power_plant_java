package com.dk_power.power_plant_java.entities.permits;

import com.dk_power.power_plant_java.entities.base_entities.BasePermitEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.envers.Audited;

import java.time.LocalDateTime;

@Entity
@Table(name = "work_request")
@Getter
@Setter
@Audited
public class WorkRequest extends BasePermitEntity {

    private String dateOfWorkToBePerformed;
    private String timeOfWorkToBePerformed;
    private String requestedBy;
    private String company;
    private String location;
    private String affectedEquipment;

    @Column(length = 5000)
    private String workScope;

    private Boolean isHotWorkRequired;
    private String foreman;
    private String fireWatch;

    private Boolean isLotoRequired;
    private Boolean isConfinedSpaceEntryRequired;
    private String space;
    private String sharepointId;

    // PWA tracking
    private String localUuid;           // PWA's unique ID for dedup
    private LocalDateTime submittedAt;  // When submitted from PWA
    private String submitterName;       // PWA submitter contact info
    private String submitterEmail;
    private String submitterPhone;
    private String submitterCompany;
}
