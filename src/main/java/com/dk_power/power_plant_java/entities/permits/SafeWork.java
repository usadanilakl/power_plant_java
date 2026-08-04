package com.dk_power.power_plant_java.entities.permits;

import com.dk_power.power_plant_java.entities.base_entities.BasePermitEntity;
import com.dk_power.power_plant_java.entities.permits.pojo.SwHazards;
import com.dk_power.power_plant_java.entities.permits.pojo.SwPermits;
import com.dk_power.power_plant_java.entities.permits.pojo.SwPpe;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
public class SafeWork extends BasePermitEntity {

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "daily_permit_package_id")
    private DailyPermitPackage dailyPermitPackage;

    private String date;
    private String time;
    private String companyPerson;
    private String location;
    // workScope inherited from BasePermitEntity (do not re-declare â€” causes field shadowing)
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
        if (hazardsJson == null || hazardsJson.isEmpty() || "null".equals(hazardsJson.trim())) {
            return new SwHazards();
        }
        try {
            String json = hazardsJson;
            if (json.contains("\\\"")) {
                json = json.replace("\\\"", "\"");
            }
            return mapper.readValue(json, SwHazards.class);
        } catch (Exception e) {
            return new SwHazards();
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
        if (permitsJson == null || permitsJson.isEmpty() || "null".equals(permitsJson.trim())) {
            return new SwPermits();
        }
        try {
            String json = permitsJson;
            if (json.contains("\\\"")) {
                json = json.replace("\\\"", "\"");
            }
            return mapper.readValue(json, SwPermits.class);
        } catch (Exception e) {
            return new SwPermits();
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
        if (ppeJson == null || ppeJson.isEmpty() || "null".equals(ppeJson.trim())) {
            return new SwPpe();
        }
        try {
            String json = ppeJson;
            if (json.contains("\\\"")) {
                json = json.replace("\\\"", "\"");
            }
            return mapper.readValue(json, SwPpe.class);
        } catch (Exception e) {
            return new SwPpe();
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
