package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.sync.FieldChange;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The precedence rule is the whole reason this class exists rather than a plain Map: the apply path
 * legitimately records one change twice (the CREATE branch counts it applied on the LWW verdict alone,
 * while a later pass can still defer it), and the passes do not guarantee which fires last. An
 * unresolved outcome must always win, or a change that was never resolved gets acked and lost.
 */
@DisplayName("DispositionLedger precedence + id handling")
class DispositionLedgerTest {

    private static FieldChange change(String field) {
        FieldChange c = new FieldChange("LotoPoint", 1L, field, null, "v",
                "M1", "machine-1", FieldChange.ChangeType.UPDATE);
        c.setId(UUID.randomUUID());
        return c;
    }

    @Test
    @DisplayName("DEFERRED beats APPLIED regardless of which is recorded first")
    void deferredOutranksApplied_bothOrders() {
        DispositionLedger a = new DispositionLedger();
        FieldChange c1 = change("f1");
        a.record(c1, ChangeDisposition.APPLIED);
        a.record(c1, ChangeDisposition.DEFERRED);
        assertThat(a.of(c1)).as("APPLIED then DEFERRED").isEqualTo(ChangeDisposition.DEFERRED);

        DispositionLedger b = new DispositionLedger();
        FieldChange c2 = change("f2");
        b.record(c2, ChangeDisposition.DEFERRED);
        b.record(c2, ChangeDisposition.APPLIED);
        assertThat(b.of(c2)).as("DEFERRED then APPLIED — order must not matter").isEqualTo(ChangeDisposition.DEFERRED);
    }

    @Test
    @DisplayName("a resolved outcome never overwrites an unresolved one")
    void unresolvedAlwaysWins() {
        DispositionLedger l = new DispositionLedger();
        FieldChange c = change("f");
        l.record(c, ChangeDisposition.FAILED_RETRYABLE);
        l.record(c, ChangeDisposition.NOOP_SUPERSEDED);
        l.record(c, ChangeDisposition.APPLIED);
        l.record(c, ChangeDisposition.DEAD_LETTER);
        assertThat(l.of(c))
                .as("FAILED_RETRYABLE outranks every resolved outcome — it must not be acked")
                .isEqualTo(ChangeDisposition.FAILED_RETRYABLE);
    }

    @Test
    @DisplayName("identity-keyed: two changes with equal content are tracked separately")
    void identityKeyed_notValueKeyed() {
        DispositionLedger l = new DispositionLedger();
        FieldChange c1 = change("same");
        FieldChange c2 = change("same");
        l.record(c1, ChangeDisposition.APPLIED);
        l.record(c2, ChangeDisposition.DEFERRED);
        assertThat(l.of(c1)).isEqualTo(ChangeDisposition.APPLIED);
        assertThat(l.of(c2)).isEqualTo(ChangeDisposition.DEFERRED);
        assertThat(l.size()).isEqualTo(2);
    }

    @Test
    @DisplayName("null-id changes are recorded but excluded from idsWith (preserves the existing hole exactly)")
    void nullIdRecordedButNotReturnedById() {
        DispositionLedger l = new DispositionLedger();
        FieldChange withId = change("a");
        FieldChange noId = change("b");
        noId.setId(null);
        l.record(withId, ChangeDisposition.DEFERRED);
        l.record(noId, ChangeDisposition.DEFERRED);

        assertThat(l.of(noId)).as("recorded faithfully").isEqualTo(ChangeDisposition.DEFERRED);
        assertThat(l.count(ChangeDisposition.DEFERRED)).isEqualTo(2);
        assertThat(l.idsWith(ChangeDisposition.DEFERRED))
                .as("a null-id change cannot be acked or re-pulled by id — mirrors markDeferred's guard")
                .containsExactly(withId.getId());
    }

    @Test
    @DisplayName("counts and lookups are null-safe and never throw inside the apply path")
    void nullSafe() {
        DispositionLedger l = new DispositionLedger();
        l.record(null, ChangeDisposition.APPLIED);
        l.record(change("x"), null);
        l.recordAll(null, ChangeDisposition.APPLIED);
        assertThat(l.size()).isZero();
        assertThat(l.of(null)).isNull();
        assertThat(l.count(ChangeDisposition.APPLIED)).isZero();
    }
}
