package com.dk_power.power_plant_java.entities.diagrams;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Where;

@Entity
@Table(name = "diagram_connection")
@NoArgsConstructor
@Getter
@Setter
@Where(clause = "deleted IS NOT TRUE")
public class DiagramConnection extends BaseAuditEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "diagram_id")
    private Diagram diagram;

    // In-diagram sequential ID
    private Integer localId;

    // Connection endpoints (reference DiagramPlacement.localId within same diagram)
    private Integer sourcePlacementLocalId;
    private Integer targetPlacementLocalId;

    private String sourceAnchor;
    private String targetAnchor;

    // Multi-port support (e.g., 3-way valve port A/B)
    private String sourcePort;
    private String targetPort;

    // Pipe template provenance
    private Long pipeTemplateId;
    private String pipeName;

    @Column(columnDefinition = "TEXT")
    private String pipeParamsJson;

    // Visual
    @Column(columnDefinition = "TEXT")
    private String waypointsJson;

    private String lineStyle;
    private Integer lineWidth;
    private String color;
}
