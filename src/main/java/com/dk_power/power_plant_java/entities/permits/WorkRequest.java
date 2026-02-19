package com.dk_power.power_plant_java.entities.permits;

import com.dk_power.power_plant_java.entities.base_entities.BasePermitEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Where;
import org.hibernate.envers.Audited;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "work_request")
@Getter
@Setter
@Audited
@Where(clause = "deleted IS NOT TRUE")
public class WorkRequest extends BasePermitEntity {

    private String dateOfWorkToBePerformed;
    private String timeOfWorkToBePerformed;
    private String requestedBy;
    private String company;
    private String location;
    private String affectedEquipment;

    // workScope inherited from BasePermitEntity (do not re-declare — causes field shadowing)

    private Boolean isHotWorkRequired;
    private String foreman;
    private String fireWatch;

    private Boolean isLotoRequired;
    private Boolean isConfinedSpaceEntryRequired;
    private String space;
    private String sharepointId;

    @OneToMany(mappedBy = "workRequest", fetch = FetchType.LAZY)
    private List<Jha> jhas = new ArrayList<>();

    // PWA tracking
    @Column(name = "local_uuid")
    private String localUuid;

    @Column(name = "time_submitted")
    private String timeSubmitted;

    @Column(name = "submitter_name")
    private String submitterName;

    @Column(name = "submitter_email")
    private String submitterEmail;

    @Column(name = "submitter_phone")
    private String submitterPhone;

    @Column(name = "submitter_company")
    private String submitterCompany;
}
