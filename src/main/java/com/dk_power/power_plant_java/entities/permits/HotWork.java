package com.dk_power.power_plant_java.entities.permits;

import com.dk_power.power_plant_java.entities.base_entities.BasePermitEntity;
import com.dk_power.power_plant_java.entities.permits.pojo.HotWorkMeasures;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.envers.Audited;

@Entity
@Table(name = "hot_work")
@Getter
@Setter
@Audited
public class HotWork extends BasePermitEntity {

    private String date;
    private String foreman;
    private String fireWatch;
    private String meterModel;
    private String meterNum;
    private String specialInstructions;

    @Column(columnDefinition = "TEXT")
    private String measuresJson;

    private static final ObjectMapper mapper = new ObjectMapper();

    public HotWorkMeasures getMeasures() {
        if (measuresJson == null || measuresJson.isEmpty()) {
            return new HotWorkMeasures();
        }
        try {
            return mapper.readValue(measuresJson, HotWorkMeasures.class);
        } catch (Exception e) {
            throw new RuntimeException("Cannot deserialize measuresJson", e);
        }
    }

    public void setMeasures(HotWorkMeasures measures) {
        try {
            this.measuresJson = mapper.writeValueAsString(measures);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Cannot serialize measures object", e);
        }
    }

}
