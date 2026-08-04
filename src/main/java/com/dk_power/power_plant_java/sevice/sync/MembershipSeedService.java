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
    private final MembershipCrdtService membershipCrdtService;
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

        new TransactionTemplate(transactionManager).executeWithoutResult(s -> {
            long total = 0;
            for (OwningM2M f : fields) {
                total += seedField(f, baseline);
            }
            // Marker last, in the SAME tx — so a crash mid-seed rolls back entirely and re-runs next boot.
            eventRepository.save(new MembershipEvent(MARKER_OWNER_TYPE, 0L, MARKER_FIELD, -1L, Op.RESET,
                    baseline, MembershipCrdtService.SEED_ORIGIN,
                    java.util.UUID.nameUUIDFromBytes("membership-seed-marker".getBytes(java.nio.charset.StandardCharsets.UTF_8))));
            log.info("membership.seed complete — seeded {} baseline ADD event(s) across {} field(s)", total, fields.size());
        });
    }

    /** Read every join row for one field and record a baseline ADD; returns rows seeded. */
    @SuppressWarnings("unchecked")
    private long seedField(OwningM2M f, Instant baseline) {
        List<Object[]> rows = entityManager.createNativeQuery(
                        "SELECT " + f.ownerColumn() + ", " + f.inverseColumn() + " FROM " + f.joinTable())
                .getResultList();
        for (Object[] row : rows) {
            if (row[0] == null || row[1] == null) continue;
            Long ownerId = ((Number) row[0]).longValue();
            Long elementId = ((Number) row[1]).longValue();
            membershipCrdtService.seedBaselineAdd(f.entityType(), ownerId, f.fieldName(), elementId, baseline);
        }
        if (!rows.isEmpty()) {
            log.info("membership.seed {}.{} → {} join row(s) from {}", f.entityType(), f.fieldName(), rows.size(), f.joinTable());
        }
        return rows.size();
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
