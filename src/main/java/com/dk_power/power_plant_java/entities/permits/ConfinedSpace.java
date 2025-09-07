package com.dk_power.power_plant_java.entities.permits;

import com.dk_power.power_plant_java.entities.base_entities.BasePermitEntity;
import com.dk_power.power_plant_java.entities.permits.pojo.ConfinedSpaceHazards;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.envers.Audited;

@Entity
@Table(name = "confined_space")
@Getter
@Setter
@Audited
public class ConfinedSpace extends BasePermitEntity {

    private String date;
    private String time;
    private String space;
    private String workScope;
    private String issuedTo;
    private String duration;
    private String lotoNum;
    private String hotWorkNum;
    private boolean ventilation;
    private boolean blankFlanged;
    private String meterModel;
    private String meterNum;
    private boolean calibrated;

    @Column(columnDefinition = "TEXT")
    private String hazardsJson;

    private static final ObjectMapper mapper = new ObjectMapper();

    public ConfinedSpaceHazards getHazards() {
        if (hazardsJson == null || hazardsJson.isEmpty()) {
            return new ConfinedSpaceHazards();
        }
        try {
            return mapper.readValue(hazardsJson, ConfinedSpaceHazards.class);
        } catch (Exception e) {
            throw new RuntimeException("Cannot deserialize hazardsJson", e);
        }
    }

    public void setHazards(ConfinedSpaceHazards hazards) {
        try {
            this.hazardsJson = mapper.writeValueAsString(hazards);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Cannot serialize hazards object", e);
        }
    }

    // Getters and setters for all other fields
    // ...
}
