package com.dk_power.power_plant_java.entities.permits;

import com.dk_power.power_plant_java.entities.base_entities.BasePermitEntity;
import com.dk_power.power_plant_java.entities.permits.pojo.ConfinedSpaceHazards;
import com.dk_power.power_plant_java.entities.permits.pojo.ConfinedSpacePpe;
import com.dk_power.power_plant_java.entities.permits.pojo.ConfinedSpacePrecautions;
import com.dk_power.power_plant_java.entities.permits.pojo.ConfinedSpaceType;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PostLoad;
import jakarta.persistence.Table;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "confined_space")
@Getter
@Setter
public class ConfinedSpace extends BasePermitEntity {

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "daily_permit_package_id")
    private DailyPermitPackage dailyPermitPackage;

    @Enumerated(EnumType.STRING)
    private ConfinedSpaceType csType = ConfinedSpaceType.PERMIT_REQUIRED;

    @PostLoad
    private void backfillCsType() {
        if (csType == null) csType = ConfinedSpaceType.PERMIT_REQUIRED;
    }

    private String date;
    private String time;
    private String space;
    // workScope inherited from BasePermitEntity (do not re-declare â€” causes field shadowing)
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
        if (hazardsJson == null || hazardsJson.isEmpty() || "null".equals(hazardsJson.trim())) {
            return new ConfinedSpaceHazards();
        }
        try {
            String json = hazardsJson;
            if (json.contains("\\\"")) {
                json = json.replace("\\\"", "\"");
            }
            return mapper.readValue(json, ConfinedSpaceHazards.class);
        } catch (Exception e) {
            return new ConfinedSpaceHazards();
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
        if (precautionsJson == null || precautionsJson.isEmpty() || "null".equals(precautionsJson.trim())) {
            return new ConfinedSpacePrecautions();
        }
        try {
            String json = precautionsJson;
            if (json.contains("\\\"")) {
                json = json.replace("\\\"", "\"");
            }
            return mapper.readValue(json, ConfinedSpacePrecautions.class);
        } catch (Exception e) {
            return new ConfinedSpacePrecautions();
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
        if (ppeJson == null || ppeJson.isEmpty() || "null".equals(ppeJson.trim())) {
            return new ConfinedSpacePpe();
        }
        try {
            String json = ppeJson;
            if (json.contains("\\\"")) {
                json = json.replace("\\\"", "\"");
            }
            return mapper.readValue(json, ConfinedSpacePpe.class);
        } catch (Exception e) {
            return new ConfinedSpacePpe();
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
