package com.dk_power.power_plant_java.entities.permits;

import com.dk_power.power_plant_java.entities.base_entities.BasePermitEntity;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.dk_power.power_plant_java.entities.permits.pojo.HotWorkMeasures;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "hot_work")
@Getter
@Setter
public class HotWork extends BasePermitEntity {

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "daily_permit_package_id")
    private DailyPermitPackage dailyPermitPackage;

    private String date;
    private String foreman;
    private String fireWatch;
    private String meterModel;
    private String meterNum;
    /**
     * Calibration date of the gas meter ("Cal Date" on the paper form). Distinct from
     * {@link #date}, which is the permit date — the printable form previously bound both cells to
     * `date`, so they were two views onto one control and editing either clobbered the other.
     */
    private String meterCalDate;
    private String specialInstructions;
    private String location;
    private Boolean isAirMonitoringRegisteredOnConfinedSpace;
    private Boolean isFireWatchRequired;
    private String timeOfInitialTest;
    private String initialTestResult;

    @Column(columnDefinition = "TEXT")
    private String measuresJson;

    private static final ObjectMapper mapper = new ObjectMapper();

    public HotWorkMeasures getMeasures() {
        if (measuresJson == null || measuresJson.isEmpty() || "null".equals(measuresJson.trim())) {
            return new HotWorkMeasures();
        }
        try {
            String json = measuresJson;
            if (json.contains("\\\"")) {
                json = json.replace("\\\"", "\"");
            }
            return mapper.readValue(json, HotWorkMeasures.class);
        } catch (Exception e) {
            return new HotWorkMeasures();
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
