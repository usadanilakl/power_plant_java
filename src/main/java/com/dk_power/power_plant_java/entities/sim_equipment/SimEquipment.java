package com.dk_power.power_plant_java.entities.sim_equipment;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Where;

@Entity
@Table(name = "sim_equipment",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_sim_equipment_source",
        columnNames = {"sourceEntityType", "sourceEntityId"}
    )
)
@NoArgsConstructor
@Getter
@Setter
@Where(clause = "deleted IS NOT TRUE")
public class SimEquipment extends BaseAuditEntity {
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    // Visual identity
    private String symbolId;
    @Column(columnDefinition = "TEXT")
    private String svgPath;
    private Integer defaultWidth;
    private Integer defaultHeight;
    private String defaultColor;

    // Simulation behavior
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private SimRole simRole;

    @Column(columnDefinition = "TEXT")
    private String simParamsJson;

    // Source entity mapping (idempotent — one SimEquipment per source)
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private SourceEntityType sourceEntityType;

    private Long sourceEntityId;
}
