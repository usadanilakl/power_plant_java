package com.dk_power.power_plant_java.entities.schedule;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.dk_power.power_plant_java.entities.users.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Where;

import java.time.LocalDate;

/**
 * Schedule v2 — places one {@link User} into one {@link CrewPattern} for a date range, in a role,
 * at a rotation offset. The materialiser walks active assignments overlapping each target date and
 * resolves the person's shift from {@code crew.patternCells} at the current cycle day.
 *
 * <p>The rotation is anchored to an absolute epoch day (not {@code startDate}) so the cycle is
 * stable when assignments are edited; {@link #patternOffsetDays} phases each person/crew into the
 * cycle. {@code startDate}/{@code endDate} only bound WHEN the assignment applies.
 */
@Entity
@Table(name = "crew_assignment")
@Getter
@Setter
@NoArgsConstructor
@Where(clause = "deleted IS NOT TRUE")
public class CrewAssignment extends BaseAuditEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "crew_id")
    private CrewPattern crew;

    /** One of {@link CrewPattern.Role}: LEAD | AO | RELIEF. Selects which grid row applies. */
    @Column(name = "role")
    private String role;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    /** Days added to the absolute cycle index — phases this person/crew into the rotation. */
    @Column(name = "pattern_offset_days")
    private Integer patternOffsetDays;

    @Column(name = "is_active")
    private Boolean isActive;
}
