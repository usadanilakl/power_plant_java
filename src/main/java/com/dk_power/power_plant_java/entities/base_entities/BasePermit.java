package com.dk_power.power_plant_java.entities.base_entities;

import com.dk_power.power_plant_java.enums.PermitType;
import com.dk_power.power_plant_java.enums.Status;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.envers.Audited;

@MappedSuperclass
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Audited
//@Inheritance(strategy = InheritanceType.TABLE_PER_CLASS)
public class BasePermit extends BaseEntity {
    private String workScope;
    private String system;
    private String equipment;
    private String requestor;
    private String controlAuthority;
    @Enumerated(EnumType.STRING)
    private PermitType type;
    private Long docNum;
    private Status status;
    private Boolean temp;

}
