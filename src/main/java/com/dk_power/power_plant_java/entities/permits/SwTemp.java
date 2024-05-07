package com.dk_power.power_plant_java.entities.permits;

import com.dk_power.power_plant_java.dto.permits.SwDto;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.util.List;

@Entity
@NoArgsConstructor
@Data
@EntityListeners(AuditingEntityListener.class)
public class SwTemp {
    private String requestor, controlAuthority,  system, workScope, equipment;
    @CreatedBy
    @Id
    private String id;
    @CreatedBy
    private String createdBy;
    @ManyToMany(mappedBy = "swTempList")
    private List<Ticket> tickets;
    @ManyToMany(mappedBy = "swTempList")
    private List<TicketTemp> ticketsTemp;

    public SwTemp(String requestor, String controlAuthority, String createdBy, String system, String workScope, String equipment) {
        this.requestor = requestor;
        this.controlAuthority = controlAuthority;
        this.system = system;
        this.workScope = workScope;
        this.equipment = equipment;
    }

    public void copy(SwDto other) {
        this.requestor = other.getRequestor();
        this.controlAuthority = other.getControlAuthority();
        this.system = other.getSystem();
        this.workScope = other.getWorkScope();
        this.equipment = other.getEquipment();
    }
}
