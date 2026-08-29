package com.dk_power.power_plant_java.entities.permits;

import com.dk_power.power_plant_java.entities.base_entities.BasePermitEntity;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.dk_power.power_plant_java.entities.permits.pojo.HotWorkMeasures;
import com.dk_power.power_plant_java.entities.permits.pojo.HotWorkType;
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
    /** @deprecated superseded by {@link #fireWatchDuration} in the 2026-08-27 revision. Kept so
     *  existing rows are not silently reinterpreted; not printed on the current form. */
    @Deprecated
    private Boolean isFireWatchRequired;
    private String timeOfInitialTest;
    private String initialTestResult;

    // ---- 2026-08-27 revision ----------------------------------------------------------------

    /** "Initials" beside the initial air test. */
    private String initialTestInitials;

    /** Fire-protection two-state block: in service vs NOT in service + plant-manager approval. */
    private Boolean fireProtectionInService;
    private Boolean fireProtectionNotInService;
    private String fireProtectionApprovalDateTime;

    /** Second meter used for the mandatory continuous air monitoring. */
    private String contMeterModel;
    private String contMeterNum;
    private String contMeterCalDate;

    /**
     * Fire Watch duration. Three separate booleans because the paper prints three independently
     * positioned checkboxes under three column headers — a single tri-state control cannot be
     * laid out that way. Exclusivity is the operator's, exactly as on paper.
     */
    private Boolean fireWatch1Hour;
    private Boolean fireWatch30Min;
    private Boolean fireWatchNotRequired;

    /** Issuer approval block. */
    private String issuerSignature;
    private String approvedDate;
    private String approvedTime;

    /** ACTIVE HOT WORK section. */
    private String actualStartTime;
    private String actualEndTime;

    /** Cancellation & monitoring section. */
    private String cancelRequestorName;
    private String cancelRequestorSignature;
    private String cancelRequestorDate;
    private String cancelRequestorTime;
    private String cancelFireWatchName;
    private String cancelFireWatchSignature;
    private String cancelFireWatchDate;
    private String cancelFireWatchTime;
    private String fireMonitoringMethod;
    private String fireMonitorName;
    private String fireMonitorSignature;
    private String fireMonitorDate;
    private String fireMonitorTime;
    private Boolean workCompleted;
    private String cancelledBy;
    private String cancelledDate;
    private String cancelledTime;

    @Column(columnDefinition = "TEXT")
    private String measuresJson;

    @Column(columnDefinition = "TEXT")
    private String workTypeJson;

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

    public HotWorkType getWorkType() {
        if (workTypeJson == null || workTypeJson.isEmpty() || "null".equals(workTypeJson.trim())) {
            return new HotWorkType();
        }
        try {
            String json = workTypeJson;
            if (json.contains("\\\"")) {
                json = json.replace("\\\"", "\"");
            }
            return mapper.readValue(json, HotWorkType.class);
        } catch (Exception e) {
            return new HotWorkType();
        }
    }

    public void setWorkType(HotWorkType workType) {
        try {
            this.workTypeJson = mapper.writeValueAsString(workType);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Cannot serialize workType object", e);
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
