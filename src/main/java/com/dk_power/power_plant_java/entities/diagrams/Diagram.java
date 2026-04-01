package com.dk_power.power_plant_java.entities.diagrams;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Where;

import java.util.ArrayList;
import java.util.List;

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

    // Legacy JSON blobs — kept for backward compatibility during migration
    @Column(columnDefinition = "TEXT")
    private String shapesJson;

    @Column(columnDefinition = "TEXT")
    private String connectionsJson;

    private Integer gridSize = 20;

    private Long contextFileId;

    private String contextFileName;

    @OneToMany(mappedBy = "diagram", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DiagramPlacement> placements = new ArrayList<>();

    @OneToMany(mappedBy = "diagram", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DiagramConnection> connections = new ArrayList<>();
}
