package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.categories.Category;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.loto.LotoStandard;
import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.repository.categories.CategoryRepo;
import com.dk_power.power_plant_java.repository.categories.ValueRepo;
import com.dk_power.power_plant_java.repository.loto.LotoStandardRepo;
import com.dk_power.power_plant_java.repository.sync.FieldChangeRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.test.annotation.Rollback;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.transaction.TestTransaction;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;
import java.util.Objects;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

/**
 * Verifies whether JPA mutation of {@code Value} references through repo
 * {@code save} reliably fires {@link com.dk_power.power_plant_java.sevice.sync.FieldChangeEntityListener#postUpdate(Object)}
 * for both scalar {@code @ManyToOne Value} and {@code @ManyToMany Set<Value>} cases.
 *
 * <p>This is the gate for the dedup rewrite. If both cases produce a
 * {@link FieldChange} row, the rewrite can rely on bare JPA mutation. If the
 * ManyToMany case does NOT produce a row, the rewrite must emit a synthetic
 * {@code FieldChange} via {@link FieldChangeTracker#trackEntityUpdate(java.util.Map, com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity)}
 * with a pre-mutation collection snapshot.
 */
@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:dedup-fc-emission-it;DB_CLOSE_DELAY=-1;MODE=LEGACY",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "test.cleanup.enabled=false"
})
@DisplayName("Dedup mutation → FieldChange emission verification")
// Class-level @Transactional keeps everything in one persistence context so that
// LotoStandard's cascade-persist on Value doesn't see detached references between
// repo calls. Rollback(false) ensures the FieldChange rows survive for assertions
// (FieldChangeTracker uses REQUIRES_NEW so its rows commit independently, but
// we keep this explicit). em.flush() inside each test forces @PostUpdate to fire.
@Transactional
@Rollback(false)
class DedupFieldChangeEmissionIT {

    @Autowired private CategoryRepo categoryRepo;
    @Autowired private ValueRepo valueRepo;
    @Autowired private LotoStandardRepo lotoStandardRepo;
    @Autowired private FieldChangeRepository fieldChangeRepository;
    @Autowired private EntityManager entityManager;
    @Autowired private FieldChangeTracker fieldChangeTracker;
    @Autowired private ValueReferenceRepointService valueReferenceRepointService;
    @Autowired private PlatformTransactionManager transactionManager;
    @SpyBean private SyncEventPublisher syncEventPublisher;

    @MockBean private com.dk_power.power_plant_java.sevice.automation.RedTagAutomationService redTagAutomationService;

    @Test
    @DisplayName("Scalar @ManyToOne Value repoint via JPA emits FieldChange on owner")
    void scalar_manyToOne_repoint_emits_field_change() {
        Category cat = persistCategory("statusCat", "status");
        Value v1 = persistValue("draft", cat);
        Value v2 = persistValue("approved", cat);

        LotoStandard ls = new LotoStandard();
        ls.setDevelopmentStatus(v1);
        lotoStandardRepo.saveAndFlush(ls);
        Long lsId = ls.getId();

        long before = countOwnerFieldChanges(lsId, "developmentStatus");

        // The rewrite's mutation path: load, set scalar, save+flush.
        LotoStandard loaded = lotoStandardRepo.findById(lsId).orElseThrow();
        Value v2Loaded = valueRepo.findById(v2.getId()).orElseThrow();
        loaded.setDevelopmentStatus(v2Loaded);
        lotoStandardRepo.saveAndFlush(loaded);
        entityManager.flush();

        long after = countOwnerFieldChanges(lsId, "developmentStatus");
        System.out.println("[POSTUPDATE-VERIFY] scalar developmentStatus FieldChange emitted: " + (after > before));
        assertThat(after)
                .as("Scalar @ManyToOne Value mutation should fire @PostUpdate and emit a FieldChange row")
                .isGreaterThan(before);
    }

    @Test
    @DisplayName("ManyToMany Set<Value> repoint via JPA alone does NOT emit FieldChange")
    void manyToMany_set_value_repoint_does_not_emit_without_synthetic_track() {
        Category cat = persistCategory("groupCat", "group");
        Value v1 = persistValue("g1", cat);
        Value v2 = persistValue("g2", cat);
        Long v1Id = v1.getId();

        LotoStandard ls = new LotoStandard();
        ls.getGroups().add(v1);
        lotoStandardRepo.saveAndFlush(ls);
        entityManager.flush();
        Long lsId = ls.getId();

        long before = countOwnerFieldChanges(lsId, "groups");

        // The naive collection mutation path: load, id-based removeIf, add canonical,
        // save+flush. Hibernate emits DELETE+INSERT on the join table but does NOT
        // update the owner row, so @PostUpdate never fires and no FieldChange row
        // is written. This is the gap the dedup rewrite must close by explicitly
        // calling fieldChangeTracker.trackEntityUpdate with a pre-mutation snapshot.
        LotoStandard loaded = lotoStandardRepo.findById(lsId).orElseThrow();
        Value v2Loaded = valueRepo.findById(v2.getId()).orElseThrow();
        loaded.getGroups().removeIf(v -> v != null && Objects.equals(v.getId(), v1Id));
        loaded.getGroups().add(v2Loaded);
        lotoStandardRepo.saveAndFlush(loaded);
        entityManager.flush();

        long after = countOwnerFieldChanges(lsId, "groups");
        boolean emitted = after > before;
        System.out.println("[POSTUPDATE-VERIFY] manyToMany groups FieldChange emitted (bare JPA): " + emitted);

        // Asserting NOT emitted documents the gap. If this ever flips to true (e.g.
        // Hibernate behavior change, or BaseIdEntity gains forced-dirty behavior),
        // the test failure will tell us we can drop the synthetic-emit fallback.
        assertThat(emitted)
                .as("Bare JPA mutation of ManyToMany Set<Value> is currently NOT tracked by FieldChangeEntityListener")
                .isFalse();
    }

    @Test
    @DisplayName("repointAllReferences defers ManyToMany FieldChange until emitPendingFieldChanges is called")
    void repointAllReferences_defers_collection_field_change_until_emit() {
        Category cat = persistCategory("groupCatDeferred", "groupDef");
        Value v1 = persistValue("gd1", cat);
        Value v2 = persistValue("gd2", cat);

        LotoStandard ls = new LotoStandard();
        ls.getGroups().add(v1);
        lotoStandardRepo.saveAndFlush(ls);
        entityManager.flush();
        Long lsId = ls.getId();

        long before = countOwnerFieldChanges(lsId, "groups");

        // Phase 1: mutate. The helper performs the JPA repoint AND captures a
        // pending synthetic FieldChange descriptor — but does NOT emit.
        ValueReferenceRepointService.Metadata meta = valueReferenceRepointService.discover();
        ValueReferenceRepointService.RepointOutcome outcome =
                valueReferenceRepointService.repointAllReferences(v1.getId(), v2, meta);
        entityManager.flush();

        long midway = countOwnerFieldChanges(lsId, "groups");
        System.out.println("[POSTUPDATE-VERIFY] post-repoint, pre-emit FieldChange count delta: " + (midway - before));
        // The synthetic FieldChange must not have committed yet — that's the
        // whole point of deferring past verify-before-delete.
        assertThat(midway)
                .as("repointAllReferences must NOT emit synthetic FieldChange yet (defer past verify)")
                .isEqualTo(before);
        assertThat(outcome.pendingCollectionFieldChanges)
                .as("collection mutation should have been captured as pending")
                .isNotEmpty();

        // Phase 2: emit. After verify-before-delete and soft-delete in real
        // dedup; here we just call it directly.
        valueReferenceRepointService.emitPendingFieldChanges(outcome.pendingCollectionFieldChanges);

        long after = countOwnerFieldChanges(lsId, "groups");
        System.out.println("[POSTUPDATE-VERIFY] post-emit FieldChange count delta: " + (after - before));
        assertThat(after)
                .as("emitPendingFieldChanges should produce a synthetic FieldChange row for the collection mutation")
                .isGreaterThan(before);
    }

    @Test
    @DisplayName("Pair tx rollback unwinds synthetic FieldChange row AND skips SSE broadcast")
    void pairTxRollback_unwinds_field_change_row_and_skips_broadcast() {
        Category cat = persistCategory("groupCatRollback", "groupRb");
        Value v1 = persistValue("rb1", cat);
        Value v2 = persistValue("rb2", cat);

        LotoStandard ls = new LotoStandard();
        ls.getGroups().add(v1);
        lotoStandardRepo.saveAndFlush(ls);
        entityManager.flush();
        Long lsId = ls.getId();
        Long v1Id = v1.getId();
        Long v2Id = v2.getId();

        // Commit the setup so the nested REQUIRES_NEW tx can actually see
        // these rows. The class-level @Transactional otherwise leaves them
        // uncommitted, invisible to other transactions.
        TestTransaction.flagForCommit();
        TestTransaction.end();
        // Restart a tx for subsequent repository assertions.
        TestTransaction.start();

        long beforeFieldChanges = countOwnerFieldChanges(lsId, "groups");
        Mockito.clearInvocations(syncEventPublisher);

        // Run the pair work inside a REQUIRES_NEW tx and mark it rollback-only,
        // exactly matching the production dedup pattern when verify-before-delete
        // finds remaining references. The TransactionTemplate is built with the
        // same PlatformTransactionManager the production code uses.
        TransactionTemplate t = new TransactionTemplate(transactionManager);
        t.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        t.execute(status -> {
            Value canon = valueRepo.findById(v2Id).orElseThrow();
            ValueReferenceRepointService.Metadata meta = valueReferenceRepointService.discover();
            ValueReferenceRepointService.RepointOutcome outcome =
                    valueReferenceRepointService.repointAllReferences(v1Id, canon, meta);
            entityManager.flush();
            // Emit synthetic FieldChange. Joins this REQUIRES_NEW tx via
            // trackEntityUpdateInCurrentTx (MANDATORY). DB row inserted but
            // not yet committed.
            valueReferenceRepointService.emitPendingFieldChanges(outcome.pendingCollectionFieldChanges);
            // Roll the pair back — mimics verify-before-delete deciding to abort.
            status.setRollbackOnly();
            return null;
        });

        long afterFieldChanges = countOwnerFieldChanges(lsId, "groups");
        System.out.println("[POSTUPDATE-VERIFY] post-rollback FieldChange row delta: "
                + (afterFieldChanges - beforeFieldChanges));

        assertThat(afterFieldChanges)
                .as("Synthetic FieldChange row should NOT persist after pair tx rollback")
                .isEqualTo(beforeFieldChanges);

        // Even though the FieldChange row was inserted into the DB before the
        // rollback fired, the publishOnCommit indirection should have deferred
        // syncEventPublisher.publishChanges to afterCommit — which, for the
        // rolled-back tx, never fires.
        verify(syncEventPublisher, never()).publishChanges(any());
    }

    @Test
    @DisplayName("Synthetic FieldChange emission for ManyToMany via FieldChangeTracker DOES produce a row")
    void manyToMany_synthetic_field_change_emit_works() {
        Category cat = persistCategory("groupCatSynthetic", "groupSynth");
        Value v1 = persistValue("gs1", cat);
        Value v2 = persistValue("gs2", cat);
        Long v1Id = v1.getId();

        LotoStandard ls = new LotoStandard();
        ls.getGroups().add(v1);
        lotoStandardRepo.saveAndFlush(ls);
        entityManager.flush();
        Long lsId = ls.getId();

        long before = countOwnerFieldChanges(lsId, "groups");

        LotoStandard loaded = lotoStandardRepo.findById(lsId).orElseThrow();
        Value v2Loaded = valueRepo.findById(v2.getId()).orElseThrow();

        // Capture pre-mutation collection state BEFORE removeIf/add. The tracker
        // diffs originalValues (frozen here) against the entity's current state
        // after the mutation, so the snapshot must be taken first.
        Set<Value> originalGroups = new HashSet<>(loaded.getGroups());
        Map<String, Object> originalValues = new HashMap<>();
        originalValues.put("groups", originalGroups);

        loaded.getGroups().removeIf(v -> v != null && Objects.equals(v.getId(), v1Id));
        loaded.getGroups().add(v2Loaded);
        lotoStandardRepo.saveAndFlush(loaded);
        entityManager.flush();

        // Explicit synthetic emission — this is what the dedup rewrite must call
        // for every owner+collection it mutated.
        fieldChangeTracker.trackEntityUpdate(originalValues, loaded);

        long after = countOwnerFieldChanges(lsId, "groups");
        boolean emitted = after > before;
        System.out.println("[POSTUPDATE-VERIFY] manyToMany groups FieldChange emitted (synthetic): " + emitted);

        assertThat(emitted)
                .as("Synthetic FieldChangeTracker.trackEntityUpdate should emit a row for the collection change")
                .isTrue();
    }

    // ── helpers ─────────────────────────────────────────────────────────────

    private Category persistCategory(String name, String alias) {
        Category cat = new Category(name);
        cat.setAlias(alias);
        return categoryRepo.saveAndFlush(cat);
    }

    private Value persistValue(String name, Category cat) {
        Value v = new Value(name, name);
        v.setCategory(cat);
        return valueRepo.saveAndFlush(v);
    }

    private long countOwnerFieldChanges(Long ownerId, String fieldName) {
        List<FieldChange> changes = fieldChangeRepository
                .findByEntityTypeAndEntityIdOrderByTimestampDesc("LotoStandard", ownerId);
        return changes.stream().filter(fc -> fieldName.equals(fc.getFieldName())).count();
    }
}
