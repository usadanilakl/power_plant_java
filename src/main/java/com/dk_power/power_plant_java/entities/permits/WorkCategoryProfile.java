package com.dk_power.power_plant_java.entities.permits;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.dk_power.power_plant_java.entities.categories.Value;
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

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "work_category_profile")
@Where(clause = "deleted IS NOT TRUE")
public class WorkCategoryProfile extends BaseAuditEntity {

    @OneToOne
    @JoinColumn(name = "work_category_id")
    private Value workCategory;

    @Column(columnDefinition = "TEXT")
    private String standardHazardsJson;

    @Column(columnDefinition = "TEXT")
    private String standardHotWorkMeasuresJson;

    @Column(columnDefinition = "TEXT")
    private String standardConfinedSpaceHazardsJson;

    private static final ObjectMapper mapper = new ObjectMapper();

    public SwHazards getStandardHazards() {
        if (standardHazardsJson == null || standardHazardsJson.isEmpty() || "null".equals(standardHazardsJson.trim())) {
            return new SwHazards();
        }
        try {
            return mapper.readValue(standardHazardsJson, SwHazards.class);
        } catch (Exception e) {
            throw new RuntimeException("Cannot deserialize standardHazardsJson", e);
        }
    }

    public void setStandardHazards(SwHazards hazards) {
        try {
            this.standardHazardsJson = mapper.writeValueAsString(hazards);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Cannot serialize standard hazards", e);
        }
    }

    public HotWorkMeasures getStandardHotWorkMeasures() {
        if (standardHotWorkMeasuresJson == null || standardHotWorkMeasuresJson.isEmpty() || "null".equals(standardHotWorkMeasuresJson.trim())) {
            return new HotWorkMeasures();
        }
        try {
            return mapper.readValue(standardHotWorkMeasuresJson, HotWorkMeasures.class);
        } catch (Exception e) {
            throw new RuntimeException("Cannot deserialize standardHotWorkMeasuresJson", e);
        }
    }

    public void setStandardHotWorkMeasures(HotWorkMeasures measures) {
        try {
            this.standardHotWorkMeasuresJson = mapper.writeValueAsString(measures);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Cannot serialize standard hot work measures", e);
        }
    }

    public ConfinedSpaceHazards getStandardConfinedSpaceHazards() {
        if (standardConfinedSpaceHazardsJson == null || standardConfinedSpaceHazardsJson.isEmpty() || "null".equals(standardConfinedSpaceHazardsJson.trim())) {
            return new ConfinedSpaceHazards();
        }
        try {
            return mapper.readValue(standardConfinedSpaceHazardsJson, ConfinedSpaceHazards.class);
        } catch (Exception e) {
            throw new RuntimeException("Cannot deserialize standardConfinedSpaceHazardsJson", e);
        }
    }

    public void setStandardConfinedSpaceHazards(ConfinedSpaceHazards hazards) {
        try {
            this.standardConfinedSpaceHazardsJson = mapper.writeValueAsString(hazards);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Cannot serialize standard confined space hazards", e);
        }
    }
}
