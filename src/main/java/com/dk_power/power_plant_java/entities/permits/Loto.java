package com.dk_power.power_plant_java.entities.permits;

import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.entities.SuperModel;
import com.dk_power.power_plant_java.enums.Status;
import jakarta.persistence.Entity;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.envers.Audited;


@Entity
@Audited
@Data
@NoArgsConstructor
public class Loto extends SuperModel {
    private String workScope;
    private String system;
    private String equipment;
    private String requestor;
    private String controlAuthority;
    private Long lotoNum;
    private Status status;

    public Loto(String workScope, String system, String equipment, String requestor, String controlAuthority) {
        super();
        this.workScope = workScope;
        this.system = system;
        this.equipment = equipment;
        this.requestor = requestor;
        this.controlAuthority = controlAuthority;
    }

    public void copy(LotoDto other) {
        this.requestor = other.getRequestor();
        this.controlAuthority = other.getControlAuthority();
        this.system = other.getSystem();
        this.workScope = other.getWorkScope();
        this.equipment = other.getEquipment();
    }
}
