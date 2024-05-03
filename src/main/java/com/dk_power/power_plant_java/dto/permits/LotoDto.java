package com.dk_power.power_plant_java.dto.permits;

import com.dk_power.power_plant_java.util.PermitNumberGenerator;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;

@Entity
@NoArgsConstructor
@Data
public class LotoDto {
    @Id
    private Long lotoNum;
    private String requestor, controlAuthority, createdBy, system, workScope, equipment;

    public LotoDto(String requestor, String controlAuthority, String createdBy, String system, String workScope, String equipment) {
        this.lotoNum = PermitNumberGenerator.generateLotoNumber();
        this.requestor = requestor;
        this.controlAuthority = controlAuthority;
        this.createdBy = createdBy;
        this.system = system;
        this.workScope = workScope;
        this.equipment = equipment;
    }
}
