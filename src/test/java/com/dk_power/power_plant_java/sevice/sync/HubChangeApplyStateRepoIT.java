package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.sync.HubChangeApplyState;
import com.dk_power.power_plant_java.repository.sync.HubChangeApplyStateRepo;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The durable hub apply-state mechanics (Inc 7), proven at the repository layer so the guarantees hold
 * regardless of caller: MONOTONIC compare-and-set (a terminal is never re-opened by a retryable write —
 * amendment #2) and the SPLIT retry budget (a dependency-wait is aged out by time, a real failure by a
 * bounded attempt count — amendment #3). Each is RED against a naive "just overwrite the row" design.
 */
@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:hub-apply-state-repo-it;DB_CLOSE_DELAY=-1;MODE=LEGACY",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "test.cleanup.enabled=false"
})
@DisplayName("HubChangeApplyState durable-state mechanics")
class HubChangeApplyStateRepoIT {

    @Autowired
    private HubChangeApplyStateRepo repo;
    @Autowired
    private PlatformTransactionManager txManager;

    @MockBean
    private com.dk_power.power_plant_java.sevice.automation.RedTagAutomationService redTagAutomationService;
    @MockBean
    private com.dk_power.power_plant_java.sevice.angular.permits.WorkAreaGitHubPublisher workAreaGitHubPublisher;

    private TransactionTemplate tx() {
        return new TransactionTemplate(txManager);
    }

    private UUID givenRow(String disposition, int attempts, Instant firstSeenAt) {
        UUID id = UUID.randomUUID();
        tx().executeWithoutResult(s -> {
            HubChangeApplyState row = new HubChangeApplyState();
            row.setChangeId(id);
            row.setDisposition(disposition);
            row.setAttempts(attempts);
            row.setFirstSeenAt(firstSeenAt);
            row.setEntityType("LotoPoint");
            row.setEntityId(1L);
            repo.save(row);
        });
        return id;
    }

    private String dispositionOf(UUID id) {
        return tx().execute(s -> repo.findById(id).orElseThrow().getDisposition());
    }

    private int attemptsOf(UUID id) {
        return tx().execute(s -> repo.findById(id).orElseThrow().getAttempts());
    }

    @Test
    @DisplayName("flipToTerminal flips PENDING -> APPLIED but is STICKY once terminal")
    void flipToTerminal_isMonotonic() {
        UUID id = givenRow(HubChangeApplyState.PENDING, 0, Instant.now());

        int flipped = tx().execute(s -> repo.flipToTerminal(id, "APPLIED", Instant.now()));
        assertThat(flipped).isEqualTo(1);
        assertThat(dispositionOf(id)).isEqualTo("APPLIED");

        // A second, different terminal must NOT overwrite the first — terminals are sticky.
        int reflipped = tx().execute(s -> repo.flipToTerminal(id, "NOOP_SUPERSEDED", Instant.now()));
        assertThat(reflipped).as("terminal is sticky — CAS touches only non-terminal rows").isZero();
        assertThat(dispositionOf(id)).isEqualTo("APPLIED");
    }

    @Test
    @DisplayName("bumpFailed can NEVER clobber an APPLIED row (the amendment-#2 race)")
    void bumpFailed_cannotClobberTerminal() {
        UUID id = givenRow(HubChangeApplyState.PENDING, 0, Instant.now());
        tx().execute(s -> repo.flipToTerminal(id, "APPLIED", Instant.now()));

        // Simulate the parked-vthread race: a late bumpRetryable arrives after the rescan already applied.
        int bumped = tx().execute(s -> repo.bumpFailed(id, Instant.now()));

        assertThat(bumped).as("a retryable write must not re-open a terminal").isZero();
        assertThat(dispositionOf(id)).isEqualTo("APPLIED");
        assertThat(attemptsOf(id)).isZero();
    }

    @Test
    @DisplayName("bumpFailed advances the attempt budget; bumpDeferred does NOT (split budget)")
    void splitBudget_onlyFailuresBurnAttempts() {
        UUID failing = givenRow(HubChangeApplyState.PENDING, 0, Instant.now());
        UUID waiting = givenRow(HubChangeApplyState.PENDING, 0, Instant.now());

        tx().execute(s -> repo.bumpFailed(failing, Instant.now()));
        tx().execute(s -> repo.bumpFailed(failing, Instant.now()));
        tx().execute(s -> repo.bumpDeferred(waiting, Instant.now()));
        tx().execute(s -> repo.bumpDeferred(waiting, Instant.now()));

        assertThat(dispositionOf(failing)).isEqualTo("FAILED_RETRYABLE");
        assertThat(attemptsOf(failing)).as("a real failure burns the bounded budget").isEqualTo(2);

        assertThat(dispositionOf(waiting)).isEqualTo("DEFERRED");
        assertThat(attemptsOf(waiting))
                .as("a dependency-wait must NOT burn attempts, or a slow parent dead-letters its child")
                .isZero();
    }

    @Test
    @DisplayName("findRescanEligible: PENDING always; FAILED only under the cap; DEFERRED only within the window")
    void rescanEligibility_respectsSplitBudget() {
        Instant now = Instant.now();
        Instant old = now.minus(2, ChronoUnit.DAYS);

        UUID pending = givenRow(HubChangeApplyState.PENDING, 0, now);
        UUID failedUnderCap = givenRow("FAILED_RETRYABLE", 3, now);
        UUID failedOverCap = givenRow("FAILED_RETRYABLE", 15, now);
        UUID deferredFresh = givenRow("DEFERRED", 0, now);
        UUID deferredAged = givenRow("DEFERRED", 0, old);
        UUID applied = givenRow("APPLIED", 0, now);

        Instant deferredCutoff = now.minus(1, ChronoUnit.DAYS);
        List<UUID> eligible = tx().execute(s ->
                repo.findRescanEligible(15, deferredCutoff, PageRequest.of(0, 100)))
                .stream().map(HubChangeApplyState::getChangeId).toList();

        assertThat(eligible).contains(pending, failedUnderCap, deferredFresh);
        assertThat(eligible).doesNotContain(failedOverCap, deferredAged, applied);
    }

    @Test
    @DisplayName("markDeadLetter escalates a retryable row but leaves a terminal-good row alone")
    void markDeadLetter_isMonotonic() {
        UUID retryable = givenRow("FAILED_RETRYABLE", 15, Instant.now());
        UUID good = givenRow("APPLIED", 0, Instant.now());

        int escalated = tx().execute(s -> repo.markDeadLetter(retryable, Instant.now()));
        int noop = tx().execute(s -> repo.markDeadLetter(good, Instant.now()));
        assertThat(escalated).isEqualTo(1);
        assertThat(noop).isZero();

        assertThat(dispositionOf(retryable)).isEqualTo("DEAD_LETTER");
        assertThat(dispositionOf(good)).isEqualTo("APPLIED");
    }

    @Test
    @DisplayName("cleanup deletes terminal-good rows past retention but keeps recent + non-terminal ones")
    void cleanup_removesOnlyOldTerminalGood() {
        Instant now = Instant.now();
        UUID oldApplied = givenRow("APPLIED", 0, now.minus(30, ChronoUnit.DAYS));
        tx().executeWithoutResult(s -> {
            HubChangeApplyState r = repo.findById(oldApplied).orElseThrow();
            r.setAppliedAt(now.minus(30, ChronoUnit.DAYS));
            repo.save(r);
        });
        UUID recentApplied = givenRow("APPLIED", 0, now);
        tx().executeWithoutResult(s -> {
            HubChangeApplyState r = repo.findById(recentApplied).orElseThrow();
            r.setAppliedAt(now);
            repo.save(r);
        });
        UUID pending = givenRow(HubChangeApplyState.PENDING, 0, now.minus(30, ChronoUnit.DAYS));

        int deleted = tx().execute(s -> repo.deleteTerminalGoodBefore(now.minus(7, ChronoUnit.DAYS)));

        assertThat(deleted).isEqualTo(1);
        assertThat(repo.existsById(oldApplied)).isFalse();
        assertThat(repo.existsById(recentApplied)).as("recent terminal-good kept").isTrue();
        assertThat(repo.existsById(pending)).as("non-terminal never cleaned").isTrue();
    }

    private UUID givenRowFull(String disposition, Instant firstSeenAt, Instant lastAttemptAt, String entityType) {
        UUID id = UUID.randomUUID();
        tx().executeWithoutResult(s -> {
            HubChangeApplyState row = new HubChangeApplyState();
            row.setChangeId(id);
            row.setDisposition(disposition);
            row.setAttempts(0);
            row.setFirstSeenAt(firstSeenAt);
            row.setLastAttemptAt(lastAttemptAt);
            row.setEntityType(entityType);
            row.setEntityId(1L);
            repo.save(row);
        });
        return id;
    }

    @Test
    @DisplayName("findRescanEligible orders least-recently-attempted first (fairness) — the anti-starvation fix")
    void rescanEligible_ordersByFairness() {
        Instant now = Instant.now();
        // COALESCE(lastAttemptAt, firstSeenAt) ASC: never-attempted rows sort by firstSeenAt; an
        // already-attempted row (recent lastAttemptAt) sorts to the BACK so the scan rotates.
        UUID neverAttemptedOld = givenRowFull(HubChangeApplyState.PENDING, now.minus(10, ChronoUnit.HOURS), null, "LotoPoint");
        UUID recentlyAttempted = givenRowFull(HubChangeApplyState.PENDING, now.minus(9, ChronoUnit.HOURS), now.minus(1, ChronoUnit.MINUTES), "LotoPoint");
        UUID neverAttemptedNew = givenRowFull(HubChangeApplyState.PENDING, now.minus(8, ChronoUnit.HOURS), null, "LotoPoint");
        java.util.Set<UUID> mine = java.util.Set.of(neverAttemptedOld, recentlyAttempted, neverAttemptedNew);

        // Filter to just this test's rows (the shared in-memory DB carries other tests' rows).
        List<UUID> order = tx().execute(s ->
                repo.findRescanEligible(15, now.minus(1, ChronoUnit.DAYS), PageRequest.of(0, 500)))
                .stream().map(HubChangeApplyState::getChangeId).filter(mine::contains).toList();

        assertThat(order).containsExactly(neverAttemptedOld, neverAttemptedNew, recentlyAttempted);
    }

    @Test
    @DisplayName("touchPendingAttempt stamps lastAttemptAt on a PENDING row but is a no-op on a terminal one")
    void touchPendingAttempt_onlyPending() {
        UUID pending = givenRow(HubChangeApplyState.PENDING, 0, Instant.now());
        UUID applied = givenRow("APPLIED", 0, Instant.now());

        int touched = tx().execute(s -> repo.touchPendingAttempt(pending, Instant.now()));
        int noop = tx().execute(s -> repo.touchPendingAttempt(applied, Instant.now()));

        assertThat(touched).isEqualTo(1);
        assertThat(noop).as("never re-open / touch a terminal row").isZero();
        Instant stampedAt = tx().execute(s -> repo.findById(pending).orElseThrow().getLastAttemptAt());
        assertThat(stampedAt).as("PENDING now sorts to the back of the fairness order").isNotNull();
    }

    @Test
    @DisplayName("findPendingExpired: only OLD + ALREADY-ATTEMPTED PENDING — spares never-attempted (crash-before-apply / post-downtime)")
    void findPendingExpired_onlyOldAttemptedPending() {
        Instant now = Instant.now();
        // Old AND attempted → a totality-gap straggler; the valve escalates it.
        UUID oldAttempted = givenRowFull(HubChangeApplyState.PENDING, now.minus(4, ChronoUnit.DAYS), now.minus(4, ChronoUnit.DAYS), "LotoPoint");
        // Old but NEVER attempted → crash-before-apply; if the hub was offline this long it must still be
        // RETRIED, not dead-lettered before its first retry. Must be spared.
        UUID oldNeverAttempted = givenRowFull(HubChangeApplyState.PENDING, now.minus(4, ChronoUnit.DAYS), null, "LotoPoint");
        UUID freshAttempted = givenRowFull(HubChangeApplyState.PENDING, now.minus(1, ChronoUnit.HOURS), now.minus(1, ChronoUnit.HOURS), "LotoPoint");
        UUID oldDeferred = givenRow("DEFERRED", 0, now.minus(4, ChronoUnit.DAYS));

        List<UUID> expired = tx().execute(s ->
                repo.findPendingExpired(now.minus(3, ChronoUnit.DAYS), PageRequest.of(0, 500)))
                .stream().map(HubChangeApplyState::getChangeId).toList();

        assertThat(expired).contains(oldAttempted);
        assertThat(expired).as("never-attempted PENDING is a crash-before-apply row — must be retried, not dead-lettered")
                .doesNotContain(oldNeverAttempted);
        assertThat(expired).doesNotContain(freshAttempted, oldDeferred);
    }

    @Test
    @DisplayName("deadLetterStaleOrphansByType escalates one type's stale ATTEMPTED retryables, sparing never-attempted/fresh/terminal/other-type")
    void deadLetterStaleOrphans_scopedByTypeAgeAndAttempted() {
        Instant now = Instant.now();
        Instant old = now.minus(2, ChronoUnit.DAYS);
        // Stale + already attempted → the genuinely-stuck ShiftDay orphans this clears.
        UUID staleAttemptedPending = givenRowFull(HubChangeApplyState.PENDING, old, old, "ShiftDay");
        UUID staleAttemptedDeferred = givenRowFull("DEFERRED", old, old, "ShiftDay");
        // Stale but NEVER attempted → a crash-before-apply row; must be spared (retried, not abandoned).
        UUID staleNeverAttempted = givenRowFull(HubChangeApplyState.PENDING, old, null, "ShiftDay");
        UUID freshAttempted = givenRowFull(HubChangeApplyState.PENDING, now.minus(1, ChronoUnit.HOURS), now.minus(1, ChronoUnit.HOURS), "ShiftDay");
        UUID staleLoto = givenRowFull(HubChangeApplyState.PENDING, old, old, "LotoPoint");
        UUID appliedShift = givenRowFull("APPLIED", old, old, "ShiftDay");

        int n = tx().execute(s ->
                repo.deadLetterStaleOrphansByType("ShiftDay", now.minus(1, ChronoUnit.DAYS), now));

        assertThat(n).as("only the two stale + attempted ShiftDay retryables").isEqualTo(2);
        assertThat(dispositionOf(staleAttemptedPending)).isEqualTo("DEAD_LETTER");
        assertThat(dispositionOf(staleAttemptedDeferred)).isEqualTo("DEAD_LETTER");
        assertThat(dispositionOf(staleNeverAttempted)).as("never-attempted crash-before-apply row is spared").isEqualTo(HubChangeApplyState.PENDING);
        assertThat(dispositionOf(freshAttempted)).as("age floor spares a just-received change").isEqualTo(HubChangeApplyState.PENDING);
        assertThat(dispositionOf(staleLoto)).as("type-scoped — never touches another type").isEqualTo(HubChangeApplyState.PENDING);
        assertThat(dispositionOf(appliedShift)).as("monotonic — never re-opens a terminal").isEqualTo("APPLIED");
    }
}
