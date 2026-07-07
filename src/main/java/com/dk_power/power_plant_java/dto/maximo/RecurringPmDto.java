package com.dk_power.power_plant_java.dto.maximo;

import com.dk_power.power_plant_java.entities.maximo.RecurrenceCadence;
import com.dk_power.power_plant_java.entities.maximo.ShiftPreference;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** Wire shape for a recurring-PM catalog row. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecurringPmDto {
    private Long id;
    private String pmKey;
    private String pmnum;
    private String pmDescription;
    private String lead;
    private RecurrenceCadence cadence;
    private Integer intervalDays;
    private Boolean classificationLocked;
    private ShiftPreference shift;
    private Integer preferredDayOfWeek;   // ISO 1=Mon..7=Sun; null = none
    private Integer occurrenceCount;
    private String lastWonum;
    private LocalDate lastTargetDate;
    private LocalDateTime catalogRefreshedAt;
    private Boolean manuallyAdded;        // true = operator manually converted a WO to a recurring task
    private String formKey;               // assigned electronic completion form (MaximoFormTemplate.formKey), or null
}
