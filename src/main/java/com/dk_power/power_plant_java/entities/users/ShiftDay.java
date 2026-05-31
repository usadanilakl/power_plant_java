package com.dk_power.power_plant_java.entities.users;

import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Where;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "shift_days",
       indexes = {
           @Index(name = "idx_shift_days_date", columnList = "shift_date", unique = true),
           @Index(name = "idx_shift_days_year", columnList = "shift_year")
       })
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Where(clause = "deleted IS NOT TRUE")
public class ShiftDay extends BaseIdEntity {

    @Column(name = "shift_date", nullable = false)
    private LocalDate date;

    @Column(name = "shift_year", nullable = false)
    private Integer year;

    @Column(name = "day_shift_json", columnDefinition = "TEXT")
    private String dayShiftJson;

    @Column(name = "night_shift_json", columnDefinition = "TEXT")
    private String nightShiftJson;

    @Column(name = "unscheduled_json", columnDefinition = "TEXT")
    private String unscheduledJson;

    @Column(name = "pto_json", columnDefinition = "TEXT")
    private String ptoJson;

    @Column(name = "training_json", columnDefinition = "TEXT")
    private String trainingJson;

    @Column(name = "on_call_manager_name")
    private String onCallManagerName;

    @Column(name = "on_call_manager_user_id")
    private Long onCallManagerUserId;

    @Column(name = "source")
    private String source;

    @Column(name = "last_synced_at")
    private LocalDateTime lastSyncedAt;
}
