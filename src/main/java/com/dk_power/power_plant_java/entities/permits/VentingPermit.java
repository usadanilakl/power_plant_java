package com.dk_power.power_plant_java.entities.permits;

import com.dk_power.power_plant_java.entities.base_entities.BasePermitEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.envers.Audited;

@Entity
@Table(name = "venting_permit")
@Getter
@Setter
@Audited
public class VentingPermit extends BasePermitEntity {
    private String date;
    private String time;
    private String location;
    private String issuedTo;
}
