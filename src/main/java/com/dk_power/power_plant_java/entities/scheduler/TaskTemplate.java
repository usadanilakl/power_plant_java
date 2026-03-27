package com.dk_power.power_plant_java.entities.scheduler;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.enums.TaskType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Where;

@Entity
@Getter
@Setter
@Where(clause = "deleted IS NOT TRUE")
public class TaskTemplate extends BaseAuditEntity {
    private String description;

    @Enumerated(EnumType.STRING)
    private TaskType taskType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "default_priority_id")
    private Value defaultPriority;

    @Column(columnDefinition = "TEXT")
    private String stepTemplatesJson;

    @Column(columnDefinition = "TEXT")
    private String defaultReferenceTypesJson;
}
