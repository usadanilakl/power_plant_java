package com.dk_power.power_plant_java.entities.loto;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Advisory "grab" claim for a LOTO permit's hang or verify phase on the PWA — mirrors the Maximo-PM / LOTO-Standards
 * grab so the shared "ready to hang / verify" list shows who is currently working a permit and two people don't
 * silently collide. Soft only: separation-of-duty and predecessor rules are still enforced server-side at submit.
 *
 * <p>Hub-local plain {@code @Entity} (IDENTITY id, off the CRDT sync path — the hub is the single point all PWA users
 * hit, and grabs are ephemeral operational state, not synced permit data). Walkdown uses {@code WalkdownSession}
 * (its {@code startedBy}) as its own grab, so only HANG/VERIFY need a claim record here.</p>
 */
@Entity
@Table(name = "loto_permit_grab", indexes = @Index(name = "ix_loto_grab", columnList = "lotoId, phase, active"))
@Getter
@Setter
@NoArgsConstructor
public class LotoPermitGrab {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long lotoId;

    /** HANG | VERIFY. */
    @Column(length = 16)
    private String phase;

    /** Acting user's principal name (email under our auth). */
    private String grabbedBy;
    /** Human display name, for the list. */
    private String grabbedByName;
    private LocalDateTime grabbedAt;

    private boolean active = true;
}
