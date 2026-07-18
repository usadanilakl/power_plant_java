package com.dk_power.power_plant_java.sevice.hub;

import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.entities.sync.HubChangeApplyState;
import com.dk_power.power_plant_java.repository.sync.HubChangeApplyStateRepo;
import com.dk_power.power_plant_java.sevice.sync.ChangeDisposition;
import com.dk_power.power_plant_java.sevice.sync.HubApplyStateSink;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Hub-only implementation of {@link HubApplyStateSink} (Inc 7). Every write is a MONOTONIC compare-and-set
 * (see {@link HubChangeApplyStateRepo}) so terminals are sticky and a late {@link #bumpRetryable} can
 * never overwrite an APPLIED the rescan just wrote.
 *
 * <p>All three writes no-op when {@code sync.hub.durable-apply-state-enabled} is false, so the whole
 * durable path is inert until deliberately switched on per-hub (mirroring {@code sync.hub.apply-lww-enabled}).
 */
@Service
@ConditionalOnProperty(name = "sync.role", havingValue = "hub")
@Slf4j
public class HubApplyStateSinkImpl implements HubApplyStateSink {

    private final HubChangeApplyStateRepo repo;
    // REQUIRES_NEW template for bumpRetryable — the attempts increment must survive the apply rollback
    // that produced it, so it commits independently of the (already rolled-back) apply transaction.
    // A self-managed template (not @Transactional) so the behavior is identical whether this bean is
    // Spring-proxied or constructed directly in a test.
    private final TransactionTemplate bumpTx;

    @Value("${sync.hub.durable-apply-state-enabled:false}")
    private boolean durableApplyStateEnabled;

    // The durable path REQUIRES real LWW. Under LWW-off the hub apply blindly re-applies a change's
    // value (Inc 6 skipSave legacy), so the rescan re-applying an outstanding row could overwrite a
    // newer value a concurrent exchange already put on the hub. Requiring LWW makes every (re)apply
    // LWW-guarded, so a re-apply of an already-converged change is a harmless NOOP. Enabling durable
    // without LWW leaves the durable path INERT (fail-safe: the legacy in-memory path keeps running).
    @Value("${sync.hub.apply-lww-enabled:false}")
    private boolean applyLwwEnabled;

    public HubApplyStateSinkImpl(HubChangeApplyStateRepo repo, PlatformTransactionManager txManager) {
        this.repo = repo;
        this.bumpTx = new TransactionTemplate(txManager);
        this.bumpTx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    /** Loud fail-safe: durable requested but LWW off ⇒ durable stays inert until LWW is also enabled. */
    @jakarta.annotation.PostConstruct
    void warnIfMisconfigured() {
        if (durableApplyStateEnabled && !applyLwwEnabled) {
            log.error("sync.hub.durable-apply-state-enabled=true but sync.hub.apply-lww-enabled=false — "
                    + "the durable apply-state path is INERT (a rescan re-apply under LWW-off could "
                    + "overwrite a newer value). Enable sync.hub.apply-lww-enabled to activate it.");
        }
    }

    @Override
    public boolean isDurableEnabled() {
        return durableApplyStateEnabled && applyLwwEnabled;
    }

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void ensurePending(Collection<FieldChange> savedChanges) {
        if (!isDurableEnabled() || savedChanges == null || savedChanges.isEmpty()) return;

        // Only changes with a stable global id (Inc 4) can be tracked durably.
        List<FieldChange> withId = new ArrayList<>();
        Set<UUID> ids = new HashSet<>();
        for (FieldChange c : savedChanges) {
            if (c.getId() != null && ids.add(c.getId())) withId.add(c);
        }
        if (withId.isEmpty()) return;

        Set<UUID> existing = new HashSet<>(repo.findExistingChangeIds(ids));
        Instant now = Instant.now();
        List<HubChangeApplyState> toInsert = new ArrayList<>();
        for (FieldChange c : withId) {
            if (existing.contains(c.getId())) continue; // already tracked — never downgrade
            HubChangeApplyState s = new HubChangeApplyState();
            s.setChangeId(c.getId());
            s.setDisposition(HubChangeApplyState.PENDING);
            s.setEntityType(c.getEntityType());
            s.setEntityId(c.getEntityId());
            s.setOriginMachineId(c.getOriginMachineId());
            s.setAttempts(0);
            s.setFirstSeenAt(now);
            toInsert.add(s);
        }
        if (!toInsert.isEmpty()) repo.saveAll(toInsert);
    }

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void persistTerminal(Map<UUID, ChangeDisposition> dispositions) {
        if (!isDurableEnabled() || dispositions == null || dispositions.isEmpty()) return;
        Instant now = Instant.now();
        for (Map.Entry<UUID, ChangeDisposition> e : dispositions.entrySet()) {
            switch (e.getValue()) {
                case APPLIED, NOOP_SUPERSEDED, DEAD_LETTER ->
                        repo.flipToTerminal(e.getKey(), e.getValue().name(), now);
                default -> { /* retryable — handled by bumpRetryable in its own tx */ }
            }
        }
    }

    @Override
    public void bumpRetryable(Map<UUID, ChangeDisposition> dispositions) {
        if (!isDurableEnabled() || dispositions == null || dispositions.isEmpty()) return;
        bumpTx.executeWithoutResult(st -> {
            Instant now = Instant.now();
            for (Map.Entry<UUID, ChangeDisposition> e : dispositions.entrySet()) {
                switch (e.getValue()) {
                    // A real failure burns the bounded attempt budget.
                    case FAILED_RETRYABLE -> repo.bumpFailed(e.getKey(), now);
                    // A dependency-wait must NOT burn the budget (a slow parent would dead-letter its
                    // child); DEFERRED is aged out by firstSeenAt instead.
                    case DEFERRED -> repo.bumpDeferred(e.getKey(), now);
                    default -> { /* terminal — persisted by persistTerminal */ }
                }
            }
        });
    }
}
