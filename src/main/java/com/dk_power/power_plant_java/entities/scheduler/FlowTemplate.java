package com.dk_power.power_plant_java.entities.scheduler;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Where;

@Entity
@Getter
@Setter
@Where(clause = "deleted IS NOT TRUE")
public class FlowTemplate extends BaseAuditEntity {
    private String description;

    @Column(columnDefinition = "TEXT")
    private String taskTemplatesJson;
}
