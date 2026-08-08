package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.dk_power.power_plant_java.entities.sync.MembershipEvent;
import com.dk_power.power_plant_java.entities.sync.MembershipEvent.Op;
import com.dk_power.power_plant_java.repository.sync.MembershipEventRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.metamodel.EntityType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.lang.reflect.Field;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Phase 1b enablement migration for the membership OR-Set (see
 * {@code project/features/sync-and-backup/m2m-membership-convergence.md}).
 *
 * <p>The OR-Set derives join-table membership from {@code membership_event} rows. On a node that
 * predates the feature, the join tables are full but the event log is empty — so the FIRST reconcile
 * ("Use Hub" / accept-remote / a peer's whole-set create) would see "no ADD for X" and wipe X. This
 * seeder records one baseline {@code ADD} per existing owning-{@code @ManyToMany} join row, keyed by a
 * DETERMINISTIC baseline key (fixed old timestamp + {@code __seed__} origin + a UUID derived from
 * owner/field/element). Because the key is identical on every node, converged nodes seed byte-identical
 * events and stay converged; because the baseline predates every real edit, a later real ADD/REMOVE
 * always outranks the seed, and re-running is idempotent.
 *
 * <p>Runs once (guarded by a sentinel marker row), only when the flag is on, on hub AND clients. It
 * seeds each node's CURRENT join state verbatim — it does NOT reconcile drift. The cluster must be
 * converged (drift tool → zero drift) BEFORE the flag is enabled, or pre-existing divergence is baked
 * into the baseline.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class MembershipSeedService {

    private final EntityManager entityManager;
    private final MembershipEventRepository eventRepository;
    private final PlatformTransactionManager transactionManager;

    @Value("${sync.membership.orset.enabled:false}")
    private boolean enabled;

    /** Baseline timestamp for every seeded ADD — must predate any real edit. */
    @Value("${sync.membership.orset.seed-baseline:2000-01-01T00:00:00Z}")
    private String seedBaselineIso;

    private static final String MARKER_OWNER_TYPE = "__seed_marker__";
    private static final String MARKER_FIELD = "__seeded__";

    @EventListener(ApplicationReadyEvent.class)
    public void seed() {
        if (!enabled) {
            log.info("membership.seed skipped — sync.membership.orset.enabled=false");
            return;
        }
        if (eventRepository.existsByOwnerType(MARKER_OWNER_TYPE)) {
            log.info("membership.seed skipped — already seeded (marker present)");
            return;
        }
        final Instant baseline;
        try {
            baseline = Instant.parse(seedBaselineIso);
        } catch (Exception e) {
            log.error("membership.seed ABORTED — invalid sync.membership.orset.seed-baseline='{}' ({})",
                    seedBaselineIso, e.getMessage());
            return;
        }

        List<OwningM2M> fields = discoverOwningManyToMany();
        log.info("membership.seed starting — {} owning @ManyToMany field(s), baseline={}", fields.size(), baseline);

        // Seed each field in its OWN transaction (not one giant tx): the join tables total ~25k rows on a
        // real cluster, and holding a single write-locked transaction over all of them starves a busy hub
        // (single-writer H2). Per-field commits release the lock between tables and keep each undo log
        // small. Each field is a bulk INSERT…SELECT (one statement) guarded by NOT EXISTS, so the whole
        // seed is idempotent — a crash mid-seed just re-runs the unseeded fields next boot.
        TransactionTemplate tx = new TransactionTemplate(transactionManager);
        long total = 0;
        for (OwningM2M f : fields) {
            try {
                Long n = tx.execute(s -> seedField(f, baseline));
                total += (n != null ? n : 0);
            } catch (Exception e) {
                log.error("membership.seed FAILED at {}.{} ({}) — marker NOT written, will retry next boot",
                        f.entityType(), f.fieldName(), e.getMessage());
                return;
            }
        }
        // Marker only after EVERY field committed — so a partial seed re-runs (NOT EXISTS makes it safe).
        // Wrapped in try/catch so a marker-write failure logs loudly but NEVER propagates out of the
        // ApplicationReadyEvent listener (an uncaught throw here fails the whole app startup). Op is ADD
        // (a plain sentinel row keyed by owner_type '__seed_marker__') — it deliberately does NOT use
        // RESET, so the marker survives even a stale op CHECK constraint on a table created before RESET
        // existed; if the seed itself never persisted, the marker's absence just re-runs it next boot.
        final long seeded = total;
        try {
            tx.executeWithoutResult(s -> eventRepository.save(new MembershipEvent(MARKER_OWNER_TYPE, 0L, MARKER_FIELD, -1L,
                    Op.ADD, baseline, MembershipCrdtService.SEED_ORIGIN,
                    java.util.UUID.nameUUIDFromBytes("membership-seed-marker".getBytes(java.nio.charset.StandardCharsets.UTF_8)))));
            log.info("membership.seed complete — seeded {} baseline ADD event(s) across {} field(s)", seeded, fields.size());
        } catch (Exception e) {
            log.error("membership.seed marker write FAILED — seeded {} row(s) but the marker did not persist; "
                    + "the seed will re-run idempotently next boot. Cause: {}", seeded, e.getMessage());
        }
    }

    /**
     * Bulk-seed one baseline ADD per join row for one field in a SINGLE {@code INSERT…SELECT}. The
     * {@code NOT EXISTS} guard makes it idempotent (re-runnable). {@code change_id} is RANDOM per row —
     * safe: {@code membership_event} is LOCAL (never syncs) and the baseline ts predates every real edit,
     * so a seed row can never win a comparison; only its EXISTENCE matters, which converges because both
     * nodes seed the same (drift-verified) join rows. Table/column names come from the entity's
     * {@code @JoinTable}, not user input. Returns rows inserted.
     */
    private long seedField(OwningM2M f, Instant baseline) {
        // SELECT DISTINCT the (owner, element) pairs first: some legacy join tables (e.g. file_point) hold
        // duplicate rows, and without de-duping the single INSERT would emit two identical ADD events and
        // hit the membership_event unique constraint. DISTINCT is applied in the inner query (not on the
        // outer row, which carries a per-row RANDOM_UUID). NOT EXISTS keeps it idempotent across re-runs.
        String sql = "INSERT INTO membership_event (owner_type, owner_id, field_name, element_id, op, ts, origin, change_id) "
                + "SELECT ?1, d.oid, ?2, d.eid, 'ADD', ?3, ?4, RANDOM_UUID() FROM ("
                + "SELECT DISTINCT j." + f.ownerColumn() + " AS oid, j." + f.inverseColumn() + " AS eid "
                + "FROM " + f.joinTable() + " j "
                + "WHERE j." + f.ownerColumn() + " IS NOT NULL AND j." + f.inverseColumn() + " IS NOT NULL) d "
                + "WHERE NOT EXISTS (SELECT 1 FROM membership_event me WHERE me.owner_type = ?1 "
                + "AND me.owner_id = d.oid AND me.field_name = ?2 AND me.element_id = d.eid AND me.op = 'ADD')";
        int inserted = entityManager.createNativeQuery(sql)
                .setParameter(1, f.entityType())
                .setParameter(2, f.fieldName())
                .setParameter(3, java.sql.Timestamp.from(baseline))
                .setParameter(4, MembershipCrdtService.SEED_ORIGIN)
                .executeUpdate();
        if (inserted > 0) {
            log.info("membership.seed {}.{} → {} row(s) from {}", f.entityType(), f.fieldName(), inserted, f.joinTable());
        }
        return inserted;
    }

    /** Every owning-side @ManyToMany (has @JoinTable) on a synced BaseIdEntity — the same set the apply path handles. */
    private List<OwningM2M> discoverOwningManyToMany() {
        List<OwningM2M> out = new ArrayList<>();
        for (EntityType<?> et : entityManager.getMetamodel().getEntities()) {
            Class<?> java = et.getJavaType();
            if (java == null || !BaseIdEntity.class.isAssignableFrom(java)) continue;
            for (Class<?> c = java; c != null && c != Object.class; c = c.getSuperclass()) {
                for (Field field : c.getDeclaredFields()) {
                    if (!field.isAnnotationPresent(ManyToMany.class)) continue;
                    JoinTable jt = field.getAnnotation(JoinTable.class);
                    if (jt == null || jt.joinColumns().length == 0 || jt.inverseJoinColumns().length == 0) continue;
                    out.add(new OwningM2M(java.getSimpleName(), field.getName(),
                            jt.name(), jt.joinColumns()[0].name(), jt.inverseJoinColumns()[0].name()));
                }
            }
        }
        return out;
    }

    private record OwningM2M(String entityType, String fieldName,
                             String joinTable, String ownerColumn, String inverseColumn) {}
}
