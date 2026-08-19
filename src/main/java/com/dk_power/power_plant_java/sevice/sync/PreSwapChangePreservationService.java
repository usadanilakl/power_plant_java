package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.entities.sync.PendingFileSync;
import com.dk_power.power_plant_java.entities.sync.PendingFileSync.SyncDirection;
import com.dk_power.power_plant_java.entities.sync.PendingFileSync.SyncStatus;
import com.dk_power.power_plant_java.repository.sync.FieldChangeRepository;
import com.dk_power.power_plant_java.repository.sync.PendingFileSyncRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Rescues a client's UN-PUSHED local changes across a full-DB swap.
 *
 * <p>When a desktop does a full cold-resync it REPLACES its local H2 DB with the hub's snapshot — which does
 * not contain any local change the hub never received (made while the hub was unreachable, or between the
 * last push and the swap). Those would be lost. Before the swap the Electron manager copies the old
 * {@code .mv.db} aside; after the swap + restart it calls this service with that copy's path.
 *
 * <p>The aside copy is opened <b>read-only via a completely separate JDBC connection</b> — the app's
 * {@code EntityManager} never touches it, so it cannot alter or corrupt a single live entity. The service
 * reads exactly this client's outbound backlog — {@code origin_machine_id = me AND NOT synced to "SERVER"},
 * the same predicate the outbound loop uses — and re-inserts those {@link FieldChange} rows into the LIVE
 * outbox as un-synced-to-SERVER. The normal sync loop then pushes them to the hub, which applies them (LWW)
 * and broadcasts them back so the local entities converge. Preserved by identity: a re-inserted change keeps
 * its original id, so if it had actually reached the hub and returned in the snapshot it is skipped, not
 * duplicated. Idempotent — re-running finds nothing new.
 *
 * <p>Timestamps are preserved (not stamped "now"), so LWW resolves correctly: if another node made a newer
 * change to the same field, that newer change legitimately wins — this is convergence, not loss.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PreSwapChangePreservationService {

    private final FieldChangeRepository fieldChangeRepository;
    private final PendingFileSyncRepository pendingFileSyncRepository;
    private final FieldSyncService fieldSyncService;
    private final SyncConfig syncConfig;

    @Value("${spring.datasource.username:sa}")
    private String dbUser;
    @Value("${spring.datasource.password:}")
    private String dbPass;

    private static final List<SyncStatus> ACTIVE_UPLOAD_STATUSES =
            List.of(SyncStatus.PENDING, SyncStatus.IN_PROGRESS, SyncStatus.FAILED);

    public record PreservationResult(boolean ran, int scanned, int preserved, int alreadyPresent,
                                     int fileUploadsRequeued, String message) {}

    /** A file the client still owed the hub, read from the aside queue (bytes survive the swap on disk). */
    private record PendingUpload(Long entityId, String fileNumber, String extensions) {}

    /**
     * Mark the restored hub snapshot's FOREIGN-origin changes as already-on-hub (synced-to-"SERVER"), so the
     * outbound loop doesn't re-push the hub's whole history back after a full-DB swap. Runs in its OWN
     * transaction (called separately, before {@link #preserveFromAside}) so that if the bulk UPDATE throws it
     * CANNOT taint the rescue's transaction. origin&lt;&gt;me makes it clock-skew safe: it never touches a
     * local change this client still owes the hub. Returns the number of rows marked; idempotent on retry.
     */
    @Transactional
    public int markRestoredSnapshotOnServer() {
        int marked = fieldChangeRepository.markForeignChangesSyncedToServer(syncConfig.getMachineId());
        log.info("preswap.markOnServer marked {} foreign snapshot change(s) already-on-hub (no outbound re-push)", marked);
        return marked;
    }

    @Transactional
    public PreservationResult preserveFromAside(String asideDbPath) {
        if (asideDbPath == null || asideDbPath.isBlank()) {
            return new PreservationResult(false, 0, 0, 0, 0, "no aside DB path given");
        }
        // H2 file URLs omit the .mv.db suffix.
        String base = asideDbPath.replaceFirst("(?i)\\.mv\\.db$", "");
        Path mv = Paths.get(base + ".mv.db");
        if (!Files.exists(mv)) {
            return new PreservationResult(false, 0, 0, 0, 0, "aside DB not found: " + mv);
        }

        String machineId = syncConfig.getMachineId();
        // Read-only (ACCESS_MODE_DATA=r ⇒ no lock), fail if the DB is missing. This connection is OUTSIDE
        // the app's persistence context, so it can never mutate the live DB or its entities.
        String url = "jdbc:h2:file:" + Paths.get(base).toAbsolutePath().normalize()
                + ";ACCESS_MODE_DATA=r;IFEXISTS=TRUE";

        String sql = "SELECT id, entity_type, entity_id, field_name, old_value, new_value, timestamp, " +
                "origin_machine_id, origin_machine_name, synced_to_machines, change_type, relationship_type " +
                "FROM field_change WHERE origin_machine_id = ? " +
                "AND (synced_to_machines IS NULL OR synced_to_machines NOT LIKE '%|SERVER|%')";

        int scanned = 0, present = 0;
        List<FieldChange> rescued = new ArrayList<>();
        List<PendingUpload> pendingUploads = new ArrayList<>();
        try (Connection c = DriverManager.getConnection(url, dbUser, dbPass)) {
            try (PreparedStatement ps = c.prepareStatement(sql)) {
                ps.setString(1, machineId);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        scanned++;
                        UUID id = readUuid(rs, "id");
                        if (id != null && fieldChangeRepository.existsById(id)) {
                            present++; // already made it to the hub and returned in the snapshot — don't duplicate
                            continue;
                        }
                        FieldChange fc = new FieldChange();
                        fc.setId(id); // preserve global identity; null ⇒ generator assigns a fresh uuid
                        fc.setEntityType(rs.getString("entity_type"));
                        fc.setEntityId(rs.getLong("entity_id"));
                        fc.setFieldName(rs.getString("field_name"));
                        fc.setOldValue(rs.getString("old_value"));
                        fc.setNewValue(rs.getString("new_value"));
                        fc.setTimestamp(readInstant(rs, "timestamp")); // preserve original ts for correct LWW
                        fc.setOriginMachineId(rs.getString("origin_machine_id"));
                        fc.setOriginMachineName(rs.getString("origin_machine_name"));
                        fc.setChangeType(FieldChange.ChangeType.valueOf(rs.getString("change_type")));
                        fc.setRelationshipType(rs.getString("relationship_type"));
                        fc.setReceivedAt(Instant.now());
                        // ONLY this machine — NOT "SERVER" — so the outbound loop pushes it to the hub.
                        fc.setSyncedToMachines("|" + machineId + "|");
                        rescued.add(fc);
                    }
                }
            }
            // Outstanding file UPLOADs the client still owed the hub. The file BYTES survive the swap on disk
            // (uploads/ isn't swapped) — only this queue row is lost — so re-queuing makes them upload again.
            String fileSql = "SELECT entity_id, file_number, extensions FROM pending_file_sync " +
                    "WHERE direction = 'UPLOAD' AND status <> 'COMPLETED'";
            try (PreparedStatement fps = c.prepareStatement(fileSql);
                 ResultSet frs = fps.executeQuery()) {
                while (frs.next()) {
                    pendingUploads.add(new PendingUpload(
                            frs.getLong("entity_id"), frs.getString("file_number"), frs.getString("extensions")));
                }
            } catch (SQLException fe) {
                // pending_file_sync missing/older schema — non-fatal, field changes are the primary payload.
                log.warn("preswap.preserve: could not read pending_file_sync from aside ({}) — skipping file re-queue",
                        fe.getMessage());
            }
        } catch (Exception e) {
            log.error("preswap.preserve failed reading aside DB {}: {}", asideDbPath, e.getMessage(), e);
            return new PreservationResult(false, scanned, 0, present, 0, "failed: " + e.getMessage());
        }

        int preserved = 0;
        if (!rescued.isEmpty()) {
            // 1) Apply the rescued changes to LOCAL entities so this client's OWN view reflects them right
            //    away (skipSave=true applies the mutations without writing FieldChange rows). Done first,
            //    against a clean slate, so the apply path's LWW/dedup isn't confused by the outbox rows.
            try {
                fieldSyncService.applyIncomingChanges(new ArrayList<>(rescued), true);
            } catch (Exception e) {
                // Local re-apply is best-effort; the outbox insert below still guarantees the hub gets them
                // and they round-trip to every OTHER node. Log and continue.
                log.warn("preswap.preserve: local re-apply error (changes still queued to the hub): {}", e.getMessage());
            }
            // 2) Re-insert into the outbox (un-synced-to-SERVER) so the normal loop pushes them to the hub.
            for (FieldChange fc : rescued) {
                fieldChangeRepository.save(fc);
                preserved++;
            }
        }

        // Re-queue the outstanding file uploads, skipping any the live DB already has queued for that entity.
        int filesRequeued = 0;
        for (PendingUpload pu : pendingUploads) {
            if (pu.entityId() == null) continue;
            if (pendingFileSyncRepository.existsByEntityIdAndDirectionAndStatusIn(
                    pu.entityId(), SyncDirection.UPLOAD, ACTIVE_UPLOAD_STATUSES)) {
                continue; // already queued in the fresh DB — don't duplicate
            }
            pendingFileSyncRepository.save(
                    new PendingFileSync(pu.entityId(), SyncDirection.UPLOAD, pu.fileNumber(), pu.extensions()));
            filesRequeued++;
        }

        log.info("preswap.preserve aside={} scanned={} preserved={} alreadyPresent={} filesRequeued={}",
                asideDbPath, scanned, preserved, present, filesRequeued);
        return new PreservationResult(true, scanned, preserved, present, filesRequeued,
                "preserved " + preserved + " outstanding local change(s) — applied locally + queued to the hub"
                        + (filesRequeued > 0 ? "; re-queued " + filesRequeued + " file upload(s)" : "")
                        + (present > 0 ? " (" + present + " already present)" : ""));
    }

    private UUID readUuid(ResultSet rs, String col) throws SQLException {
        Object o = rs.getObject(col);
        if (o == null) return null;
        if (o instanceof UUID u) return u;
        return UUID.fromString(o.toString());
    }

    /** Robust across H2/JDBC versions: prefer java.time mapping, fall back to Timestamp. */
    private Instant readInstant(ResultSet rs, String col) throws SQLException {
        try {
            Instant i = rs.getObject(col, Instant.class);
            if (i != null) return i;
        } catch (Exception ignore) {
            // driver doesn't support Instant as a target type — fall through
        }
        Timestamp ts = rs.getTimestamp(col);
        return ts != null ? ts.toInstant() : Instant.now();
    }
}
