package com.dk_power.power_plant_java.entities.etapro;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Where;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Where(clause = "deleted IS NOT TRUE")
public class EtaProPoint extends BaseAuditEntity {
    @Column(unique = true)
    private String pointId;
    private String description;
    private String unit;
    private String category;
    private Boolean active = true;
}
