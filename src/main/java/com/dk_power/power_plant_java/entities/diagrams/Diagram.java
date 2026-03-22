package com.dk_power.power_plant_java.entities.diagrams;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Where;

@Entity
@Table(name = "diagram")
@NoArgsConstructor
@Getter
@Setter
@Where(clause = "deleted IS NOT TRUE")
public class Diagram extends BaseAuditEntity {
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    private Integer canvasWidth = 1920;
    private Integer canvasHeight = 1080;

    @Column(columnDefinition = "TEXT")
    private String shapesJson;

    @Column(columnDefinition = "TEXT")
    private String connectionsJson;

    private Integer gridSize = 20;
}
