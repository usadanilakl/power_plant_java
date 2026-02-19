package com.dk_power.power_plant_java.entities.permits;

import com.dk_power.power_plant_java.entities.base_entities.BasePermitEntity;
import com.dk_power.power_plant_java.entities.permits.pojo.SwHazards;
import com.dk_power.power_plant_java.entities.permits.pojo.SwPermits;
import com.dk_power.power_plant_java.entities.permits.pojo.SwPpe;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.envers.Audited;

@Getter
@Setter
@Entity
@Audited
public class SafeWork extends BasePermitEntity {

    private String date;
    private String time;
    private String companyPerson;
    private String location;
    // workScope inherited from BasePermitEntity (do not re-declare — causes field shadowing)
    private String specialInstructions;
    private String requestedBy;

    @Column(columnDefinition = "TEXT")
    private String hazardsJson;

    @Column(columnDefinition = "TEXT")
    private String permitsJson;

    @Column(columnDefinition = "TEXT")
    private String ppeJson;

    private static final ObjectMapper mapper = new ObjectMapper();

    public SwHazards getHazards() {
        if (hazardsJson == null || hazardsJson.isEmpty()) {
            return new SwHazards();
        }
        try {
            return mapper.readValue(hazardsJson, SwHazards.class);
        } catch (Exception e) {
            throw new RuntimeException("Cannot deserialize hazardsJson", e);
        }
    }

    public void setHazards(SwHazards hazards) {
        try {
            this.hazardsJson = mapper.writeValueAsString(hazards);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Cannot serialize hazards object", e);
        }
    }

    public SwPermits getPermits() {
        if (permitsJson == null || permitsJson.isEmpty()) {
            return new SwPermits();
        }
        try {
            return mapper.readValue(permitsJson, SwPermits.class);
        } catch (Exception e) {
            throw new RuntimeException("Cannot deserialize permitsJson", e);
        }
    }

    public void setPermits(SwPermits permits) {
        try {
            this.permitsJson = mapper.writeValueAsString(permits);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Cannot serialize permits object", e);
        }
    }

    public SwPpe getPpe() {
        if (ppeJson == null || ppeJson.isEmpty()) {
            return new SwPpe();
        }
        try {
            return mapper.readValue(ppeJson, SwPpe.class);
        } catch (Exception e) {
            throw new RuntimeException("Cannot deserialize ppeJson", e);
        }
    }

    public void setPpe(SwPpe ppe) {
        try {
            this.ppeJson = mapper.writeValueAsString(ppe);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Cannot serialize ppe object", e);
        }
    }


}
