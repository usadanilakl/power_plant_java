package com.dk_power.power_plant_java.entities.schedule;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.dk_power.power_plant_java.entities.users.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Where;

import java.time.LocalDate;

/**
 * Schedule v2 — an ad-hoc adjustment to a materialised day for one person, overriding whatever the
 * crew pattern would produce. The materialiser applies overrides last, so they win over pattern
 * output (e.g. move someone to PTO, training, or off for a single day).
 *
 * <p>Authoring user is the inherited {@code createdBy} (Spring Data {@code @CreatedBy}).
 */
@Entity
@Table(name = "schedule_day_override",
       indexes = {
           @Index(name = "idx_sched_override_date", columnList = "override_date"),
           @Index(name = "idx_sched_override_user", columnList = "user_id")
       })
@Getter
@Setter
@NoArgsConstructor
@Where(clause = "deleted IS NOT TRUE")
public class ScheduleDayOverride extends BaseAuditEntity {

    /** Allowed values for {@link #shift}. Mirrors the v1 shift codes plus OFF. */
    public static final class Code {
        public static final String DAY = "D";
        public static final String NIGHT = "N";
        public static final String ON_CALL_MANAGER = "OCM";
        public static final String PTO = "P";
        public static final String TRAINING = "T";
        public static final String LIGHT_DUTY = "L";
        public static final String OFF = "OFF";
        private Code() {}
    }

    @Column(name = "override_date")
    private LocalDate date;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    /** One of {@link Code}: D | N | OCM | P | T | L | OFF. */
    @Column(name = "shift")
    private String shift;

    @Column(name = "reason")
    private String reason;
}
