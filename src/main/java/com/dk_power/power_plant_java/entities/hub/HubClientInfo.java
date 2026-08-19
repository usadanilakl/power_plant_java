package com.dk_power.power_plant_java.entities.hub;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "hub_client_info")
@Getter
@Setter
@NoArgsConstructor
public class HubClientInfo {

    @Id
    private String machineId;

    private String machineName;
    private String ipAddress;

    private Instant firstSeen;
    private Instant lastSeen;
    private Instant lastSyncTime;

    @Enumerated(EnumType.STRING)
    private ClientStatus status;

    private long totalChangesPushed;
    private long totalChangesPulled;
    private Integer deviceNumber;

    // ---- Per-client next-boot directive (hub-settable) ----
    // When directiveActions is set, this client's /api/update/check returns it as the update policy,
    // OVERRIDING the global update-policy.json. The client applies the actions on its next boot in the
    // fixed safe order (jar → db → files; electron handled first if present) and reports back via
    // markApplied, which sets lastAppliedDirectiveId == directiveId so a db/files action runs exactly once.
    /** CSV subset of jar,db,files,electron. Null/blank = no per-client directive (fall back to global). */
    private String directiveActions;
    /** Unique id for the current directive; the client keys "already applied" off this. */
    private String directiveId;
    /** When true the client cannot postpone ("Later"). Boxed Boolean (nullable) on purpose: a primitive
     *  boolean maps to a NOT NULL column, and ddl-auto=update silently SKIPS adding a NOT NULL column to
     *  the existing hub_client_info table (see schema.sql) — which would break client registration. */
    private Boolean directiveMandatory;
    @Column(length = 1000)
    private String directiveMessage;
    /** When the hub set the current directive. */
    private Instant directiveSetAt;
    /** The directiveId the client last reported as fully applied — equal to directiveId ⇒ nothing pending. */
    private String lastAppliedDirectiveId;
    /** When the client last reported the directive applied. */
    private Instant directiveAppliedAt;

    public enum ClientStatus {
        ONLINE, OFFLINE, SYNCING
    }

    public HubClientInfo(String machineId, String machineName, String ipAddress) {
        this.machineId = machineId;
        this.machineName = machineName;
        this.ipAddress = ipAddress;
        this.firstSeen = Instant.now();
        this.lastSeen = Instant.now();
        this.status = ClientStatus.ONLINE;
    }

    public void recordActivity() {
        this.lastSeen = Instant.now();
        this.status = ClientStatus.ONLINE;
    }

    public void recordSync(long pushed, long pulled) {
        this.lastSyncTime = Instant.now();
        this.totalChangesPushed += pushed;
        this.totalChangesPulled += pulled;
    }
}
