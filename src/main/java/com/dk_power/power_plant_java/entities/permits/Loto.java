package com.dk_power.power_plant_java.entities.permits;

import com.dk_power.power_plant_java.entities.SuperModel;
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
    private String approvedBy;
    private String controlAuthority;
    private Long lotoNum;

    public Loto(String workScope, String system, String equipment, String requestor, String approvedBy) {
        super();
        this.workScope = workScope;
        this.system = system;
        this.equipment = equipment;
        this.requestor = requestor;
        this.approvedBy = approvedBy;
    }
}
