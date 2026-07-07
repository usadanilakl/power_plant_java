package com.dk_power.power_plant_java.entities.maximo;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Where;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * A recurring Preventive-Maintenance item, identified by its Maximo PM-master id ({@code pmnum},
 * e.g. "JG-1183"). Built by deduping a year of PM work orders led by lead operators on {@code pmnum}.
 * Cadence is inferred from occurrence spacing (the PM master {@code mxapipm} is not API-readable on
 * this instance); {@code shift} (day/night) and an optional cadence override are set by the operator.
 * Drives auto-assignment of WAPPR PM work orders to whoever is on the matching shift.
 *
 * @see com.dk_power.power_plant_java.sevice.maximo.RecurringPmService
 */
@Entity
@Table(name = "recurring_pm",
       indexes = { @Index(name = "idx_recurring_pm_key", columnList = "pm_key") })
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Where(clause = "deleted IS NOT TRUE")
public class RecurringPm extends BaseAuditEntity {

    /**
     * Stable dedupe key for the recurring item: the Maximo {@code pmnum} when the WO carries one,
     * otherwise {@code "D:" + normalized description} (pmnum is sparse on these WOs). Always set.
     */
    @Column(name = "pm_key", nullable = false, length = 1024)
    private String pmKey;

    /** Maximo PM-master id (e.g. "JG-1183") when present; null for description-keyed recurring items. */
    @Column(name = "pmnum")
    private String pmnum;

    /** Human label — the most-recent occurrence's WO description. */
    @Column(name = "pm_description", columnDefinition = "TEXT")
    private String pmDescription;

    /** Lead personid seen on the occurrences (informational; assignment is recomputed from schedule). */
    @Column(name = "lead")
    private String lead;

    /** Inferred (or operator-set) repeat cadence. */
    @Enumerated(EnumType.STRING)
    @Column(name = "cadence")
    private RecurrenceCadence cadence;

    /** Median days between occurrences (the basis for the inferred cadence). */
    @Column(name = "interval_days")
    private Integer intervalDays;

    /** When true, {@link #cadence}/{@link #shift} were set manually and a catalog refresh must not overwrite them. */
    @lombok.Builder.Default
    @Column(name = "classification_locked")
    private Boolean classificationLocked = Boolean.FALSE;

    /** Which shift this PM should be assigned to (operator-set). */
    @Enumerated(EnumType.STRING)
    @lombok.Builder.Default
    @Column(name = "shift")
    private ShiftPreference shift = ShiftPreference.EITHER;

    /**
     * Preferred day of week (ISO: 1=Mon … 7=Sun), operator-set — mainly for WEEKLY PMs. When set,
     * the assignment is computed for this weekday in the WO's week (the person on the {@link #shift}
     * that day), rather than the WO's raw target date. Null = use the WO's target date as-is.
     */
    @Column(name = "preferred_day_of_week")
    private Integer preferredDayOfWeek;

    /** Number of occurrences seen in the trailing-year catalog window. */
    @Column(name = "occurrence_count")
    private Integer occurrenceCount;

    /** Most-recent occurrence's work-order number. */
    @Column(name = "last_wonum")
    private String lastWonum;

    /** Target/scheduled start date of the most-recent occurrence. */
    @Column(name = "last_target_date")
    private LocalDate lastTargetDate;

    /** When this row was last (re)built from Maximo. */
    @Column(name = "catalog_refreshed_at")
    private LocalDateTime catalogRefreshedAt;

    /**
     * True when an operator manually converted a work order into a recurring task (auto-detection didn't
     * classify it as recurring). Such rows are EXEMPT from the catalog-refresh prune — a manually-added PM
     * may be a one-off or led by a non-operator and would otherwise be dropped on the next refresh.
     */
    @lombok.Builder.Default
    @Column(name = "manually_added")
    private Boolean manuallyAdded = Boolean.FALSE;

    /**
     * Optional electronic completion form ({@code MaximoFormTemplate.formKey}) assigned to this PM. When set,
     * every active work order for this PM shows the form on its "Complete" tab and completing the WO means
     * filling it out. Null = no form (manual labor/log completion). Preserved across catalog refreshes.
     */
    @Column(name = "form_key", length = 128)
    private String formKey;
}
