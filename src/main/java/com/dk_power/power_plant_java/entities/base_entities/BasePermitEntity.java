package com.dk_power.power_plant_java.entities.base_entities;

import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.permits.WorkArea;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.enums.PermitType;
import com.dk_power.power_plant_java.enums.Status;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.NotFound;
import org.hibernate.annotations.NotFoundAction;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

/**
 * Every lookup association below points at an entity that carries
 * {@code @Where(clause = "deleted IS NOT TRUE")} — Value, User, WorkArea. Once a
 * lookup row is soft-deleted (the Category/Value dedup does exactly that when it
 * merges duplicates), any permit still holding its id has a foreign key Hibernate
 * can no longer resolve, and the default behaviour is to throw
 * EntityNotFoundException. That throw happens while the PAGE is being loaded, so
 * a single stale reference fails the whole query: a search that happens to match
 * that row returns 400 and the user sees an empty table, while a search that
 * misses it works fine. (Observed on the Work Request table: filtering by one
 * requester returned rows, filtering by another 400'd.)
 * <p>
 * {@code @NotFound(IGNORE)} makes an unresolvable reference read as {@code null}
 * — the row still loads, just without that association. All of these are already
 * EAGER (the JPA default for @ManyToOne), so nothing changes about fetching.
 * Deliberately NOT applied to explicitly LAZY associations, where it would force
 * an eager load.
 */
@MappedSuperclass
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
//@Inheritance(strategy = InheritanceType.TABLE_PER_CLASS)
public class BasePermitEntity extends BaseAuditEntity {
    @Column(columnDefinition = "TEXT")
    private String workScope;
    @ManyToOne
    @NotFound(action = NotFoundAction.IGNORE)
    @JoinColumn(name="system_id")
    private Value system;

    @ManyToMany(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
        name = "permit_equipment",
        joinColumns = @JoinColumn(name = "permit_id"),
        inverseJoinColumns = @JoinColumn(name = "equipment_id")
    )
    private Set<Equipment> equipment = new HashSet<>();
    @ManyToOne(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @NotFound(action = NotFoundAction.IGNORE)
    @JoinColumn(name="requestor_id")
    private User requestor;

    @ManyToOne(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @NotFound(action = NotFoundAction.IGNORE)
    @JoinColumn(name="control_authority_id")
    private User controlAuthority;

    @ManyToOne
    @NotFound(action = NotFoundAction.IGNORE)
    @JoinColumn(name="permit_type_id")
    private Value permitType;
    private Long docNum;

    @ManyToOne
    @NotFound(action = NotFoundAction.IGNORE)
    @JoinColumn(name="permit_status_id")
    private Value permitStatus;
    private Boolean temp;
    private String redTagNum;
    private String permitNumber;
    private String sharepointId;
    private Instant spModifiedTime;
    @Column(unique = true)
    private String localUuid;

    @ManyToOne
    @NotFound(action = NotFoundAction.IGNORE)
    @JoinColumn(name = "work_area_id")
    private WorkArea workArea;

    @ManyToOne
    @NotFound(action = NotFoundAction.IGNORE)
    @JoinColumn(name = "signed_on_by_id")
    private User signedOnBy;
    private Instant signedOnAt;

    @ManyToOne
    @NotFound(action = NotFoundAction.IGNORE)
    @JoinColumn(name = "signed_off_by_id")
    private User signedOffBy;
    private Instant signedOffAt;
}

