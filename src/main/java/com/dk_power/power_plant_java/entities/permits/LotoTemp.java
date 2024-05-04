package com.dk_power.power_plant_java.entities.permits;

import com.dk_power.power_plant_java.dto.permits.LotoDto;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.Id;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@NoArgsConstructor
@Data
@EntityListeners(AuditingEntityListener.class)
public class LotoTemp {
    private String requestor, controlAuthority,  system, workScope, equipment;
    @CreatedBy
    @Id
    private String id;
    @CreatedBy
    private String createdBy;

    public LotoTemp(String requestor, String controlAuthority, String createdBy, String system, String workScope, String equipment) {
        this.requestor = requestor;
        this.controlAuthority = controlAuthority;
        this.system = system;
        this.workScope = workScope;
        this.equipment = equipment;
    }

    public void copy(LotoDto other) {
        this.requestor = other.getRequestor();
        this.controlAuthority = other.getControlAuthority();
        this.system = other.getSystem();
        this.workScope = other.getWorkScope();
        this.equipment = other.getEquipment();
    }
}
