package com.dk_power.power_plant_java.entities.diagrams;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Where;

@Entity
@Table(name = "diagram_placement")
@NoArgsConstructor
@Getter
@Setter
@Where(clause = "deleted IS NOT TRUE")
public class DiagramPlacement extends BaseAuditEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "diagram_id")
    private Diagram diagram;

    @Column(columnDefinition = "TEXT")
    private String description;

    // In-diagram sequential ID used by connections to reference placements
    private Integer localId;

    // Simulation identity
    private String simRole;

    @Column(columnDefinition = "TEXT")
    private String simParamsJson;

    private Long simEquipmentId;

    // Source entity mapping
    private String sourceEntityType;
    private Long sourceEntityId;

    // Position on canvas
    private Integer x;
    private Integer y;
    private Integer width;
    private Integer height;
    private Integer rotation;

    // Visual properties
    private String color;
    private String fillColor;
    private Integer lineWidth;
    private String label;
    private Integer zIndex;
    private Boolean locked;
    private String groupId;

    // Shape type
    private String type; // rectangle, circle, line, text, symbol

    // Symbol fields
    private String symbolId;
    @Column(columnDefinition = "TEXT")
    private String svgPath;
    private Integer originalWidth;
    private Integer originalHeight;

    // Text fields
    @Column(columnDefinition = "TEXT")
    private String text;
    private Integer fontSize;
    private String fontFamily;

    // Circle fields
    private Integer radius;

    // Line endpoints
    private Integer startX;
    private Integer startY;
    private Integer endX;
    private Integer endY;
}
