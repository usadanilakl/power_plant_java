package com.dk_power.power_plant_java.entities.permits;

import com.dk_power.power_plant_java.entities.base_entities.BasePermitEntity;
import com.dk_power.power_plant_java.entities.permits.pojo.ConfinedSpaceHazards;
import com.dk_power.power_plant_java.entities.permits.pojo.ConfinedSpacePpe;
import com.dk_power.power_plant_java.entities.permits.pojo.ConfinedSpacePrecautions;
import com.fasterxml.jackson.annotation.JsonProperty;
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
    // workScope inherited from BasePermitEntity (do not re-declare — causes field shadowing)
    private String issuedTo;
    private String duration;

    private String meterModel;
    private String meterNum;
    private boolean calibrated;
    private String oxygen;
    private String lel;
    private String hydrogenSulfide;
    private String carbonMonoxide;
    private String ammonia;
    private String timeOfSample;
    private String testerInitials;

    @Column(columnDefinition = "TEXT")
    @JsonProperty("hazards")
    private String hazardsJson;
    @Column(columnDefinition = "TEXT")
    @JsonProperty("precautions")
    private String precautionsJson;
    @Column(columnDefinition = "TEXT")
    @JsonProperty("ppe")
    private String ppeJson;

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

    public ConfinedSpacePrecautions getPrecautions() {
        if (precautionsJson == null || precautionsJson.isEmpty()) {
            return new ConfinedSpacePrecautions();
        }
        try {
            return mapper.readValue(precautionsJson, ConfinedSpacePrecautions.class);
        } catch (Exception e) {
            throw new RuntimeException("Cannot deserialize precautionsJson", e);
        }
    }

    public void setPrecautions(ConfinedSpacePrecautions precautions) {
        try {
            this.precautionsJson = mapper.writeValueAsString(precautions);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Cannot serialize precautions object", e);
        }
    }

    public ConfinedSpacePpe getPpe() {
        if (ppeJson == null || ppeJson.isEmpty()) {
            return new ConfinedSpacePpe();
        }
        try {
            return mapper.readValue(ppeJson, ConfinedSpacePpe.class);
        } catch (Exception e) {
            throw new RuntimeException("Cannot deserialize ppeJson", e);
        }
    }

    public void setPpe(ConfinedSpacePpe ppe) {
        try {
            this.ppeJson = mapper.writeValueAsString(ppe);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Cannot serialize ppe object", e);
        }
    }


}
