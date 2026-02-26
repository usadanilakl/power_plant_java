package com.dk_power.power_plant_java.entities.permits;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.loto.LotoStandard;
import com.dk_power.power_plant_java.entities.permits.pojo.ConfinedSpaceHazards;
import com.dk_power.power_plant_java.entities.permits.pojo.HotWorkMeasures;
import com.dk_power.power_plant_java.entities.permits.pojo.SwHazards;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Where;
import org.hibernate.envers.Audited;

import java.util.HashSet;
import java.util.Set;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Audited
@Table(name = "work_area")
@Where(clause = "deleted IS NOT TRUE")
public class WorkArea extends BaseAuditEntity {

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String constantHazardsJson;

    @Column(columnDefinition = "TEXT")
    private String constantHotWorkMeasuresJson;

    @Column(columnDefinition = "TEXT")
    private String constantConfinedSpaceHazardsJson;

    @ManyToOne
    @JoinColumn(name = "area_type_id")
    private Value areaType;

    @ManyToOne
    @JoinColumn(name = "shape_id")
    private WorkAreaMapShape shape;

    @ManyToMany(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
            name = "work_area_loto_standard",
            joinColumns = @JoinColumn(name = "work_area_id"),
            inverseJoinColumns = @JoinColumn(name = "loto_standard_id")
    )
    private Set<LotoStandard> constantLotos = new HashSet<>();

    private static final ObjectMapper mapper = new ObjectMapper();

    public SwHazards getConstantHazards() {
        if (constantHazardsJson == null || constantHazardsJson.isEmpty()) {
            return new SwHazards();
        }
        try {
            return mapper.readValue(constantHazardsJson, SwHazards.class);
        } catch (Exception e) {
            throw new RuntimeException("Cannot deserialize constantHazardsJson", e);
        }
    }

    public void setConstantHazards(SwHazards hazards) {
        try {
            this.constantHazardsJson = mapper.writeValueAsString(hazards);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Cannot serialize constant hazards", e);
        }
    }

    public HotWorkMeasures getConstantHotWorkMeasures() {
        if (constantHotWorkMeasuresJson == null || constantHotWorkMeasuresJson.isEmpty()) {
            return new HotWorkMeasures();
        }
        try {
            return mapper.readValue(constantHotWorkMeasuresJson, HotWorkMeasures.class);
        } catch (Exception e) {
            throw new RuntimeException("Cannot deserialize constantHotWorkMeasuresJson", e);
        }
    }

    public void setConstantHotWorkMeasures(HotWorkMeasures measures) {
        try {
            this.constantHotWorkMeasuresJson = mapper.writeValueAsString(measures);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Cannot serialize constant hot work measures", e);
        }
    }

    public ConfinedSpaceHazards getConstantConfinedSpaceHazards() {
        if (constantConfinedSpaceHazardsJson == null || constantConfinedSpaceHazardsJson.isEmpty()) {
            return new ConfinedSpaceHazards();
        }
        try {
            return mapper.readValue(constantConfinedSpaceHazardsJson, ConfinedSpaceHazards.class);
        } catch (Exception e) {
            throw new RuntimeException("Cannot deserialize constantConfinedSpaceHazardsJson", e);
        }
    }

    public void setConstantConfinedSpaceHazards(ConfinedSpaceHazards hazards) {
        try {
            this.constantConfinedSpaceHazardsJson = mapper.writeValueAsString(hazards);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Cannot serialize constant confined space hazards", e);
        }
    }
}
