package com.dk_power.power_plant_java.entities.base_entities;

import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.permits.WorkArea;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.enums.PermitType;
import com.dk_power.power_plant_java.enums.Status;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.envers.Audited;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@MappedSuperclass
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Audited
//@Inheritance(strategy = InheritanceType.TABLE_PER_CLASS)
public class BasePermitEntity extends BaseAuditEntity {
    @Column(columnDefinition = "TEXT")
    private String workScope;
    @ManyToOne
    @JoinColumn(name="system_id")
    private Value system;

    @ManyToMany(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
        name = "permit_equipment",
        joinColumns = @JoinColumn(name = "permit_id"),
        inverseJoinColumns = @JoinColumn(name = "equipment_id")
    )
    private Set<Equipment> equipment = new HashSet<>();
    @ManyToOne(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinColumn(name="requestor_id")
    private User requestor;

    @ManyToOne(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinColumn(name="control_authority_id")
    private User controlAuthority;

    @ManyToOne
    @JoinColumn(name="permit_type_id")
    private Value permitType;
    private Long docNum;

    @ManyToOne
    @JoinColumn(name="permit_status_id")
    private Value permitStatus;
    private Boolean temp;
    private String redTagNum;
    private String permitNumber;
    private String sharepointId;
    private Instant spModifiedTime;
    private String localUuid;

    @ManyToOne
    @JoinColumn(name = "work_area_id")
    private WorkArea workArea;

    @ManyToOne
    @JoinColumn(name = "signed_on_by_id")
    private User signedOnBy;
    private Instant signedOnAt;

    @ManyToOne
    @JoinColumn(name = "signed_off_by_id")
    private User signedOffBy;
    private Instant signedOffAt;
}

