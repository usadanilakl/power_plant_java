package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.categories.Category;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.field_list.FieldListItem;
import com.dk_power.power_plant_java.repository.categories.CategoryRepo;
import com.dk_power.power_plant_java.repository.categories.ValueRepo;
import com.dk_power.power_plant_java.repository.field_list.FieldListItemRepo;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.annotation.Rollback;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.transaction.TestTransaction;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Regression for the production Value-dedup retry storm (2026-08-28): a duplicate Value whose ONLY
 * remaining references are on SOFT-DELETED owner rows (here {@code field_list_item.list_type_id} — one of
 * the exact prod columns) can never be soft-deleted, because the JPQL repoint honours
 * {@code @Where(deleted IS NOT TRUE)} and skips those rows while the native verify-count sees them. The
 * merge aborts forever, rolling back every inbound sync batch.
 *
 * <p>This test stages that precondition — a duplicate Value referenced by BOTH a live and a soft-deleted
 * FieldListItem — and asserts the merge COMPLETES: the soft-deleted straggler is swept
 * ({@code ValueReferenceRepointService.sweepResidualReferences}), the verify count reaches 0, and the
 * duplicate is soft-deleted. Against the pre-fix code the merge instead throws
 * {@code PairFailureAggregateException} and leaves the duplicate alive — so this test is RED without the
 * sweep and GREEN with it.
 */
@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:sync-softdel-it;DB_CLOSE_DELAY=-1;MODE=LEGACY",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "test.cleanup.enabled=false"
})
@DisplayName("Sync-time dedup: a soft-deleted owner reference must not block the merge (prod 2026-08-28)")
@Transactional
@Rollback(false)
class CategoryValueMergeSoftDeleteIT {

    @Autowired private CategoryRepo categoryRepo;
    @Autowired private ValueRepo valueRepo;
    @Autowired private FieldListItemRepo fieldListItemRepo;
    @Autowired private EntityManager entityManager;
    @Autowired private CategoryValueMergeService mergeService;

    @MockBean private com.dk_power.power_plant_java.sevice.automation.RedTagAutomationService redTagAutomationService;

    @Test
    @DisplayName("duplicate Value referenced only by a soft-deleted owner still merges (straggler is swept)")
    void softDeletedScalarOwner_doesNotBlockMerge() {
        Category cat = persistCategory("fliStatusCat", "status");
        // Same (lowered) name + same category => a duplicate group mergeValues() will pick up.
        Value canonical = persistValue("Draft", cat);
        Value duplicate = persistValue("draft", cat);
        Long canonicalId = canonical.getId();
        Long duplicateId = duplicate.getId();

        // One LIVE owner (JPQL repoint reaches it) + one owner that we soft-delete AFTER wiring the FK
        // (JPQL repoint can NOT reach it — this is the straggler that used to deadlock the merge).
        FieldListItem live = new FieldListItem();
        live.setListType(duplicate);
        fieldListItemRepo.saveAndFlush(live);

        FieldListItem dead = new FieldListItem();
        dead.setListType(duplicate);
        fieldListItemRepo.saveAndFlush(dead);
        Long deadId = dead.getId();
        entityManager.flush();

        // Soft-delete the straggler via native SQL so @Where hides it from the JPQL repoint but the
        // native verify-count still sees its list_type_id -> duplicate reference. This is the prod shape.
        entityManager.createNativeQuery("UPDATE field_list_item SET deleted = true WHERE id = :id")
                .setParameter("id", deadId)
                .executeUpdate();

        // Sanity: before the merge, the native (unfiltered) count sees BOTH owners referencing the dup.
        entityManager.flush();
        commit();
        assertThat(nativeCount("SELECT COUNT(*) FROM field_list_item WHERE list_type_id = " + duplicateId))
                .as("precondition: both the live and the soft-deleted owner reference the duplicate")
                .isEqualTo(2L);

        // Run the real sync-time merge cascade entry point.
        mergeService.mergeIfDuplicatesExist();
        commit();

        // ── THE decisive assertion ──────────────────────────────────────────
        // Pre-fix: the soft-deleted straggler keeps list_type_id = duplicate, verify-before-delete never
        // reaches 0, the pair aborts, and the duplicate stays alive (this is 0). Post-fix: the sweep
        // repoints it, verify reaches 0, and the duplicate is soft-deleted (this is 1).
        assertThat(nativeCount("SELECT COUNT(*) FROM val_table WHERE id = " + duplicateId + " AND deleted = true"))
                .as("duplicate Value MUST be soft-deleted — the soft-deleted straggler no longer blocks verify-before-delete")
                .isEqualTo(1L);

        assertThat(nativeCount("SELECT COUNT(*) FROM val_table WHERE id = " + canonicalId + " AND deleted = false"))
                .as("canonical Value remains alive")
                .isEqualTo(1L);

        // No owner row — live OR soft-deleted — may still point at the duplicate.
        assertThat(nativeCount("SELECT COUNT(*) FROM field_list_item WHERE list_type_id = " + duplicateId))
                .as("every reference to the duplicate is gone (live repointed via JPQL, dead swept via native SQL)")
                .isEqualTo(0L);

        // Both owners now reference the canonical.
        assertThat(nativeCount("SELECT COUNT(*) FROM field_list_item WHERE list_type_id = " + canonicalId))
                .as("live owner (JPQL) + soft-deleted owner (sweep) both now point at the canonical")
                .isEqualTo(2L);

        // The redirect record for future incoming sync.
        assertThat(nativeCount("SELECT COUNT(*) FROM dedup_id_remap WHERE entity_type = 'Value' AND original_id = "
                + duplicateId + " AND remapped_id = " + canonicalId))
                .as("dedup_id_remap row persisted for Value:duplicate -> canonical")
                .isEqualTo(1L);
    }

    // ── helpers ─────────────────────────────────────────────────────────────

    private long nativeCount(String sql) {
        return ((Number) entityManager.createNativeQuery(sql).getSingleResult()).longValue();
    }

    private void commit() {
        TestTransaction.flagForCommit();
        TestTransaction.end();
        TestTransaction.start();
    }

    private Category persistCategory(String name, String alias) {
        Category cat = new Category(name);
        cat.setAlias(alias);
        return categoryRepo.saveAndFlush(cat);
    }

    private Value persistValue(String name, Category cat) {
        Value v = new Value(name, name.toLowerCase());
        v.setCategory(cat);
        return valueRepo.saveAndFlush(v);
    }
}
