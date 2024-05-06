package com.dk_power.power_plant_java.entities.permits;

import com.dk_power.power_plant_java.dto.permits.SwDto;
import com.dk_power.power_plant_java.entities.SuperModel;
import com.dk_power.power_plant_java.enums.Status;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToMany;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.envers.Audited;

import java.util.List;


@Entity
@Audited
@Data
@NoArgsConstructor
public class Sw extends SuperModel {
    private String workScope;
    private String system;
    private String equipment;
    private String requestor;
    private String controlAuthority;
    private Long swNum;
    private Status status;
    @ManyToMany(mappedBy = "swList")
    private List<Ticket> tickets;

    public Sw(String workScope, String system, String equipment, String requestor, String controlAuthority) {
        super();
        this.workScope = workScope;
        this.system = system;
        this.equipment = equipment;
        this.requestor = requestor;
        this.controlAuthority = controlAuthority;
    }
    public void copy(SwDto other) {
        this.requestor = other.getRequestor();
        this.controlAuthority = other.getControlAuthority();
        this.system = other.getSystem();
        this.workScope = other.getWorkScope();
        this.equipment = other.getEquipment();
    }
    public void copy(Sw other) {
        this.requestor = other.getRequestor();
        this.controlAuthority = other.getControlAuthority();
        this.system = other.getSystem();
        this.workScope = other.getWorkScope();
        this.equipment = other.getEquipment();
        this.status = other.status;
    }
}
