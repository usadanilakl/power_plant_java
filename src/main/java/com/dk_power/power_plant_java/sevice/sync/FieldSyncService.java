package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.controller.sync.SyncUpdateController;
import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.repository.sync.FieldChangeRepository;
import com.dk_power.power_plant_java.sevice.ServiceFacade;
import com.dk_power.power_plant_java.sevice.angular.file.NgFileService;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import com.dk_power.power_plant_java.repository.file.FileRepo;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.lang.reflect.Field;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.locks.ReentrantLock;
import java.util.stream.Collectors;

@Service
@Slf4j
public class FieldSyncService {

    private final FieldChangeRepository fieldChangeRepository;
    private final ServiceFacade serviceFacade;
    private final SyncConfig syncConfig;
    private final ObjectMapper objectMapper;
    private final SyncContext syncContext;
    private final SyncUpdateController syncUpdateController;
    private final ApplicationEventPublisher eventPublisher;
    private final TransactionTemplate transactionTemplate;
    private final NgFileService ngFileService;
    private final FileRepo fileRepo;
    private final FileObjectSyncHandler fileObjectSyncHandler;
    private final EntityTableRegistry entityTableRegistry;
    private final CategoryValueMergeService categoryValueMergeService;
    private final WorkRequestMergeService workRequestMergeService;
    private final JhaMergeService jhaMergeService;
    private final EmailCorrespondenceMergeService emailCorrespondenceMergeService;
    private final UserMergeService userMergeService;
    private final InstrumentMergeService instrumentMergeService;
    private final InstrumentLogMergeService instrumentLogMergeService;
    private final ConversationMergeService conversationMergeService;
    private final MessageMergeService messageMergeService;
    private final DedupKeyResolver dedupKeyResolver;
    private final SyncDeadLetterService syncDeadLetterService;
    private final MembershipCrdtService membershipCrdtService;
    @PersistenceContext
    private EntityManager entityManager;

    // Set by applyIncomingChanges overload to skip re-saving FieldChanges (the hub already saved them
    // in processIncomingChangesBatched). Historically this ALSO skipped the LWW check at apply, which
    // let a concurrent exchange's OLDER change overwrite a newer one on the hub (D4 hub-bypass). That
    // second concern is now split off behind hubApplyLwwEnabled below.
    // Safe to use as plain field because applyChangesLock ensures single-threaded access.
    private boolean skipSaveFieldChanges = false;

    // When true, the hub apply path runs real LWW (with an identity short-circuit for a change comparing
    // against its OWN just-saved row) instead of blindly applying. Default FALSE = current behavior, so
    // shipping this is a no-op; it is enabled per-hub in the field (with a content-hash scan-all right
    // after) so a wrong self-compare — which would make the hub silently apply NOTHING while still
    // reporting success — can be reverted without a redeploy.
    @org.springframework.beans.factory.annotation.Value("${sync.hub.apply-lww-enabled:false}")
    private boolean hubApplyLwwEnabled;

    // When true, owning-side @ManyToMany membership applies as an LWW-Element-Set (OR-Set) via
    // MembershipCrdtService instead of the whole-set DELETE-all-then-INSERT + single LWW winner, so
    // concurrent edits converge instead of clobbering. Default FALSE = current behavior (a no-op to
    // ship); requires seeding the membership_event table from current join tables before enabling in
    // prod. See project/features/sync-and-backup/m2m-membership-convergence.md.
    @org.springframework.beans.factory.annotation.Value("${sync.membership.orset.enabled:false}")
    private boolean membershipOrsetEnabled;

    // Set by the applyIncomingChanges overload; if non-null, deferred change ids are collected here
    // so the caller can avoid acking them (D6). Plain field is safe under applyChangesLock.
    private java.util.Set<java.util.UUID> deferredChangeIds = null;

    // Per-change outcomes for the CURRENT apply run. Same plain-field-under-applyChangesLock discipline
    // as skipSaveFieldChanges/deferredChangeIds above; set and cleared in the same try/finally.
    // OBSERVER ONLY for now: every int return below is computed exactly as before and nothing reads this
    // yet — that is what makes threading it through the shared apply path a provable no-op. It becomes
    // load-bearing when acknowledgement stops acking what it never resolved.
    private DispositionLedger currentLedger = null;

    /** Record a per-change outcome for this run, if a ledger is active. Never alters control flow. */
    private void note(FieldChange change, ChangeDisposition disposition) {
        if (currentLedger != null) currentLedger.record(change, disposition);
    }

    /** Record the same outcome for every change in {@code changes}, if a ledger is active. */
    private void noteAll(java.util.Collection<FieldChange> changes, ChangeDisposition disposition) {
        if (currentLedger != null) currentLedger.recordAll(changes, disposition);
    }

    // Inc 7 (hub durable apply-state): when true, this apply run persists its per-change terminal
    // dispositions (co-commit B) into hub_change_apply_state INSIDE the apply transaction, so the hub's
    // entity state and its record of "what have I applied" commit or roll back together. Set ONLY by
    // applyIncomingChangesTracked (called only by the hub). Same plain-field-under-applyChangesLock
    // discipline as skipSaveFieldChanges/currentLedger.
    private boolean persistApplyStateThisRun = false;

    // Hub-only sink for the durable apply-state (Inc 7). Absent on clients (the impl is
    // @ConditionalOnProperty sync.role=hub), so this is optional; it is only ever touched when
    // persistApplyStateThisRun is set, which happens only on the hub.
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private HubApplyStateSink hubApplyStateSink;

    // Persistent dedup remap table — lives in memory across batches.
    // Loaded from DB once on first use (for JVM restart recovery), then kept in-memory.
    // New remaps are added in-memory AND persisted to DB as write-behind.
    // Safe as plain field because applyChangesLock ensures single-threaded access.
    private Map<String, Map<Long, Long>> idRemapTable;
    private boolean idRemapTableLoaded = false;

    // Guard to prevent concurrent merge operations in afterCommit callbacks.
    // During cold resync, many sync batches commit simultaneously — only one merge should run.
    private final AtomicBoolean mergeInProgress = new AtomicBoolean(false);

    // Serialize all applyIncomingChanges calls across threads.
    // Multiple callers (CentralSyncService, ServerSseClient, pending-sync, HubSyncService)
    // can invoke concurrently — concurrent REQUIRES_NEW transactions race to CREATE the same
    // entities, causing PK violations that mark the Hibernate session rollback-only and kill
    // entire batches. H2 doesn't benefit from concurrent writes anyway.
    private final ReentrantLock applyChangesLock = new ReentrantLock();

    public FieldSyncService(
            FieldChangeRepository fieldChangeRepository,
            ServiceFacade serviceFacade,
            SyncConfig syncConfig,
            ObjectMapper objectMapper,
            SyncContext syncContext,
            SyncUpdateController syncUpdateController,
            ApplicationEventPublisher eventPublisher,
            PlatformTransactionManager transactionManager,
            NgFileService ngFileService,
            FileRepo fileRepo,
            FileObjectSyncHandler fileObjectSyncHandler,
            EntityTableRegistry entityTableRegistry,
            CategoryValueMergeService categoryValueMergeService,
            WorkRequestMergeService workRequestMergeService,
            JhaMergeService jhaMergeService,
            EmailCorrespondenceMergeService emailCorrespondenceMergeService,
            UserMergeService userMergeService,
            InstrumentMergeService instrumentMergeService,
            InstrumentLogMergeService instrumentLogMergeService,
            ConversationMergeService conversationMergeService,
            MessageMergeService messageMergeService,
            DedupKeyResolver dedupKeyResolver,
            SyncDeadLetterService syncDeadLetterService,
            MembershipCrdtService membershipCrdtService) {
        this.fieldChangeRepository = fieldChangeRepository;
        this.serviceFacade = serviceFacade;
        this.syncConfig = syncConfig;
        this.objectMapper = objectMapper;
        this.syncContext = syncContext;
        this.syncUpdateController = syncUpdateController;
        this.eventPublisher = eventPublisher;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
        // REQUIRES_NEW ensures entity application runs in its own transaction.
        // Without this, when called from @Transactional methods (e.g. HubSyncService.syncExchange),
        // a rollback here would also roll back the caller's saved FieldChanges.
        this.transactionTemplate.setPropagationBehavior(
            org.springframework.transaction.TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        this.ngFileService = ngFileService;
        this.fileRepo = fileRepo;
        this.fileObjectSyncHandler = fileObjectSyncHandler;
        this.entityTableRegistry = entityTableRegistry;
        this.categoryValueMergeService = categoryValueMergeService;
        this.workRequestMergeService = workRequestMergeService;
        this.jhaMergeService = jhaMergeService;
        this.emailCorrespondenceMergeService = emailCorrespondenceMergeService;
        this.userMergeService = userMergeService;
        this.instrumentMergeService = instrumentMergeService;
        this.instrumentLogMergeService = instrumentLogMergeService;
        this.conversationMergeService = conversationMergeService;
        this.messageMergeService = messageMergeService;
        this.dedupKeyResolver = dedupKeyResolver;
        this.syncDeadLetterService = syncDeadLetterService;
        this.membershipCrdtService = membershipCrdtService;
    }

    /**
     * Apply incoming changes with Last-Writer-Wins per field.
     * Wrapped in sync context to prevent triggering broadcasts for incoming changes.
     *
     * This method uses programmatic transaction management to work correctly
     * when called from non-Spring-managed threads (e.g., SSE client thread).
     *
     * @return number of changes actually applied
     */
    public int applyIncomingChanges(List<FieldChange> incomingChanges) {
        return applyIncomingChanges(incomingChanges, false, null);
    }

    /**
     * @param skipSave true when FieldChanges are already saved (hub path) — prevents duplicates
     */
    public int applyIncomingChanges(List<FieldChange> incomingChanges, boolean skipSave) {
        return applyIncomingChanges(incomingChanges, skipSave, null);
    }

    /**
     * @param deferredOut if non-null, is populated with the ids of changes that were DEFERRED — not
     *        applied because a referenced parent/entity hasn't arrived yet (transient; will retry).
     *        The client uses this to acknowledge only terminal changes and keep deferred ones pending,
     *        so the hub re-sends them (fixes the D6 silent-drop where deferred relationship changes
     *        were acked and then never re-sent). NOTE: currently captures OneToMany parent-missing and
     *        unresolved ManyToOne deferrals; ManyToMany-internal and scalar-entity-not-found deferrals
     *        still fall through to ack pending the full per-change disposition work.
     */
    public int applyIncomingChanges(List<FieldChange> incomingChanges, boolean skipSave,
                                    java.util.Set<java.util.UUID> deferredOut) {
        // Serialize across all callers (CentralSyncService, ServerSseClient, pending-sync, etc.)
        // Each batch runs in REQUIRES_NEW transaction — without serialization, concurrent threads
        // race to CREATE the same entity, causing PK violations that poison the Hibernate session.
        applyChangesLock.lock();
        try {
            this.skipSaveFieldChanges = skipSave;
            this.deferredChangeIds = deferredOut;
            this.currentLedger = new DispositionLedger();
            int applied = applyIncomingChangesLocked(incomingChanges);

            // Report EVERY non-terminal change to the caller, not just the three sites that happened to
            // call markDeferred. A change is terminal (safe to acknowledge) only if it was applied,
            // superseded by a newer local value, or dead-lettered. Anything DEFERRED (a parent that
            // hasn't arrived, an incomplete ManyToMany) or FAILED_RETRYABLE (a rolled-back batch) has
            // NOT been resolved — acking it makes the sender mark it delivered and never send it again.
            // Previously those fell through to ack: an incomplete join table stayed permanently
            // incomplete, and one constraint violation silently dropped an entire batch.
            if (deferredOut != null) {
                deferredOut.addAll(currentLedger.idsWith(
                        ChangeDisposition.DEFERRED, ChangeDisposition.FAILED_RETRYABLE));
            }
            if (log.isDebugEnabled()) {
                log.debug("sync.apply.dispositions {} (returned applied={})", this.currentLedger, applied);
            }
            return applied;
        } finally {
            this.skipSaveFieldChanges = false;
            this.deferredChangeIds = null;
            this.currentLedger = null;
            applyChangesLock.unlock();
        }
    }

    /**
     * Test seam: run the same apply and RETURN the per-change ledger.
     *
     * <p>The ledger is a per-run local (see {@link DispositionLedger}) — the {@code finally} above
     * clears {@code currentLedger}, so the reference must be captured here, before the run, rather than
     * read off the field afterwards. That also keeps it readable when the batch rolls back.
     */
    DispositionLedger applyIncomingChangesForTest(List<FieldChange> incomingChanges, boolean skipSave,
                                                 java.util.Set<java.util.UUID> deferredOut) {
        applyChangesLock.lock();
        DispositionLedger ledger = new DispositionLedger();
        try {
            this.skipSaveFieldChanges = skipSave;
            this.deferredChangeIds = deferredOut;
            this.currentLedger = ledger;
            applyIncomingChangesLocked(incomingChanges);
            return ledger;
        } finally {
            this.skipSaveFieldChanges = false;
            this.deferredChangeIds = null;
            this.currentLedger = null;
            applyChangesLock.unlock();
        }
    }

    /**
     * Hub durable-apply entry point (Inc 7): apply {@code changes} AND return the per-change
     * {@link DispositionLedger}, persisting terminal dispositions into hub_change_apply_state inside the
     * apply transaction (co-commit B). The caller (hub Phase-4 vthread / the rescan) uses the returned
     * ledger to advance the retry budget for anything still non-terminal via
     * {@link HubApplyStateSink#bumpRetryable} in a separate transaction, so the attempts increment
     * survives an apply rollback.
     *
     * <p>Production sibling of {@link #applyIncomingChangesForTest} — same lock/ledger discipline, but it
     * sets {@code persistApplyStateThisRun} so co-commit B fires. Called ONLY on the hub (the sink is
     * hub-only); on a client the sink is absent and this method should not be used.
     */
    public DispositionLedger applyIncomingChangesTracked(List<FieldChange> changes, boolean skipSave) {
        applyChangesLock.lock();
        DispositionLedger ledger = new DispositionLedger();
        try {
            this.skipSaveFieldChanges = skipSave;
            this.currentLedger = ledger;
            this.persistApplyStateThisRun = true;
            applyIncomingChangesLocked(changes);
            return ledger;
        } finally {
            this.skipSaveFieldChanges = false;
            this.currentLedger = null;
            this.persistApplyStateThisRun = false;
            applyChangesLock.unlock();
        }
    }

    /** Records a change id as deferred (retry next sync), if the caller requested deferred tracking. */
    private void markDeferred(FieldChange change) {
        // Ledger first: it records faithfully even when the id is null, which the deferredChangeIds
        // guard below cannot. That null-id hole is deliberately preserved here (idsWith skips nulls) so
        // this stays a no-op; closing it is an acknowledgement decision, not an observation one.
        note(change, ChangeDisposition.DEFERRED);
        if (deferredChangeIds != null && change != null && change.getId() != null) {
            deferredChangeIds.add(change.getId());
        }
    }

    private int applyIncomingChangesLocked(List<FieldChange> incomingChanges) {
        // Mark that we're processing sync - prevents infinite loop
        // When entities are saved, the EntityListener won't broadcast these changes
        syncContext.startSync();
        try {
            // Use programmatic transaction to ensure it works from any thread
            Integer result = transactionTemplate.execute(status -> {
                try {
                    int applied = applyIncomingChangesInternal(incomingChanges);
                    // Co-commit B (Inc 7): persist terminal dispositions (APPLIED/NOOP/DEAD_LETTER) into
                    // hub_change_apply_state in THIS transaction, so the hub's entity state and its record
                    // of "what have I applied" commit or roll back together. No-op unless this is a hub
                    // tracked run (persistApplyStateThisRun). On the rollback path below this never runs,
                    // so the co-committed PENDING rows correctly stay PENDING for the rescan.
                    if (persistApplyStateThisRun && hubApplyStateSink != null && currentLedger != null) {
                        hubApplyStateSink.persistTerminal(currentLedger.idDispositions());
                    }
                    return applied;
                } catch (Exception e) {
                    log.error("Error applying incoming changes, rolling back: {}", e.getMessage(), e);
                    // NOTHING in this batch survived the rollback — every change is retryable, not
                    // resolved. The returned 0 cannot express that, and the receiver currently acks the
                    // whole batch anyway (one constraint violation silently drops every change in it).
                    // Recorded here so acknowledgement can stop doing that; the return stays 0.
                    noteAll(incomingChanges, ChangeDisposition.FAILED_RETRYABLE);
                    status.setRollbackOnly();
                    return 0;
                }
            });
            return result != null ? result : 0;
        } catch (org.springframework.transaction.UnexpectedRollbackException e) {
            // setRollbackOnly() inside the lambda causes TransactionTemplate.execute()
            // to throw UnexpectedRollbackException when it tries to commit.
            // This is expected when applyIncomingChangesInternal fails — the transaction
            // was already rolled back, just return 0 and let the caller continue.
            log.warn("Transaction rolled back during incoming changes (batch of {}): {}",
                incomingChanges.size(), e.getMessage());
            noteAll(incomingChanges, ChangeDisposition.FAILED_RETRYABLE);
            return 0;
        } finally {
            syncContext.endSync();
        }
    }

    /**
     * Internal method that actually applies the changes.
     * Uses batch queries for conflict resolution to eliminate N+1 query problem.
     *
     * Two-pass approach:
     * 1. First pass: Apply all non-ManyToMany changes (entity creations, updates, deletes)
     * 2. Second pass: Apply ManyToMany changes after all referenced entities exist
     *
     * This prevents foreign key constraint violations when ManyToMany references
     * entities that are created in the same sync batch.
     */
    private int applyIncomingChangesInternal(List<FieldChange> incomingChanges) {
        // Clear the persistence context to ensure fresh state for this batch.
        // This is important when SSE batches arrive in quick succession -
        // entities created in one batch need to be loadable from DB in the next.
        entityManager.clear();

        // ==================== SINGLE-PASS CATEGORIZATION ====================
        // Categorize all changes in one pass instead of multiple stream iterations.
        // Relationship collection changes (OneToMany, ManyToMany) are deferred to later passes
        // to ensure all referenced entities exist before FK columns are set.
        List<FieldChange> manyToManyChanges = new ArrayList<>();
        List<FieldChange> oneToManyChanges = new ArrayList<>();
        List<FieldChange> nonRelationshipCollectionChanges = new ArrayList<>();
        List<FieldChange> fileObjectChanges = new ArrayList<>();
        List<FieldChange> valueNameChanges = new ArrayList<>();

        for (FieldChange change : incomingChanges) {
            // Categorize by relationship type
            if ("ManyToMany".equals(change.getRelationshipType())) {
                manyToManyChanges.add(change);
            } else if ("OneToMany".equals(change.getRelationshipType())) {
                oneToManyChanges.add(change);
            } else {
                nonRelationshipCollectionChanges.add(change);
            }

            // Collect FileObject changes for file sync
            if ("FileObject".equals(change.getEntityType())) {
                fileObjectChanges.add(change);
            }

            // Collect Value name changes for file structure cleanup
            if ("Value".equals(change.getEntityType())
                    && "name".equals(change.getFieldName())
                    && change.getOldValue() != null
                    && change.getNewValue() != null) {
                valueNameChanges.add(change);
            }
        }
        // ==================== END SINGLE-PASS CATEGORIZATION ====================

        // Group scalar/ManyToOne changes by entity type (excludes deferred OneToMany and ManyToMany)
        Map<String, Map<Long, List<FieldChange>>> changesByEntity = nonRelationshipCollectionChanges.stream()
            .collect(Collectors.groupingBy(
                FieldChange::getEntityType,
                Collectors.groupingBy(FieldChange::getEntityId)
            ));

        int totalApplied = 0;

        // Collect broadcasts to send AFTER transaction commits
        List<Runnable> pendingBroadcasts = new ArrayList<>();

        // Collect failed ManyToOne references for retry in third pass
        List<FailedManyToOneReference> failedManyToOneRefs = new ArrayList<>();

        // Pre-save dedup: track ID remappings when a duplicate is redirected to an existing entity.
        // Key: entityType -> {incomingId -> existingId}
        // Load from DB once on first use (JVM restart recovery), then stays in memory.
        if (!idRemapTableLoaded) {
            idRemapTable = loadPersistentRemaps();
            idRemapTableLoaded = true;
        }

        // FIRST PASS: Process non-ManyToMany changes in SYNC_ORDER (dependency order)
        // This ensures base entities (Category, Value, FileObject) are created before
        // entities that reference them (Equipment, LotoPoint), preventing ManyToOne failures.
        for (String entityType : entityTableRegistry.getSyncOrder()) {
            Map<Long, List<FieldChange>> changesById = changesByEntity.get(entityType);
            if (changesById == null || changesById.isEmpty()) {
                continue; // No changes for this entity type
            }

            // Batch fetch latest changes for all entities of this type (eliminates N+1)
            List<Long> entityIds = new ArrayList<>(changesById.keySet());
            Map<String, FieldChange> latestChangesMap = batchFetchLatestChanges(entityType, entityIds);

            for (Map.Entry<Long, List<FieldChange>> idEntry : changesById.entrySet()) {
                Long entityId = idEntry.getKey();
                List<FieldChange> changes = idEntry.getValue();

                int applied = applyEntityChangesBatched(entityType, entityId, changes, latestChangesMap, failedManyToOneRefs, idRemapTable);
                totalApplied += applied;

                // Queue broadcast for after transaction commits
                if (applied > 0) {
                    // Capture values for lambda — use canonical ID if this entity was remapped
                    final String type = entityType;
                    final Long id = DedupKeyResolver.resolveRemappedId(entityType, entityId, idRemapTable);
                    final List<FieldChange> changeList = new ArrayList<>(changes);
                    pendingBroadcasts.add(() -> syncUpdateController.broadcastEntityUpdate(type, id, changeList));
                }

                // Broadcast activity event (real-time feed)
                emitActivityEvent("RECEIVING", entityType, entityId, changes, applied > 0 ? "SUCCESS" : "SKIPPED");
            }
        }

        // Process any entity types not in SYNC_ORDER (edge case)
        Set<String> processedTypes = new HashSet<>(entityTableRegistry.getSyncOrder());
        for (Map.Entry<String, Map<Long, List<FieldChange>>> entityEntry : changesByEntity.entrySet()) {
            String entityType = entityEntry.getKey();
            if (processedTypes.contains(entityType)) {
                continue; // Already processed in ordered pass
            }

            Map<Long, List<FieldChange>> changesById = entityEntry.getValue();
            List<Long> entityIds = new ArrayList<>(changesById.keySet());
            Map<String, FieldChange> latestChangesMap = batchFetchLatestChanges(entityType, entityIds);

            for (Map.Entry<Long, List<FieldChange>> idEntry : changesById.entrySet()) {
                Long entityId = idEntry.getKey();
                List<FieldChange> changes = idEntry.getValue();

                int applied = applyEntityChangesBatched(entityType, entityId, changes, latestChangesMap, failedManyToOneRefs, idRemapTable);
                totalApplied += applied;

                if (applied > 0) {
                    final String type = entityType;
                    final Long id = entityId;
                    final List<FieldChange> changeList = new ArrayList<>(changes);
                    pendingBroadcasts.add(() -> syncUpdateController.broadcastEntityUpdate(type, id, changeList));
                }

                emitActivityEvent("RECEIVING", entityType, entityId, changes, applied > 0 ? "SUCCESS" : "SKIPPED");
            }
        }

        // Flush to ensure all entities are persisted before relationship passes
        if (!oneToManyChanges.isEmpty() || !manyToManyChanges.isEmpty()) {
            try {
                entityManager.flush();
            } catch (Exception e) {
                log.warn("Flush failed before relationship passes: {}", e.getMessage());
                entityManager.clear();
            }
        }

        // SECOND PASS: Process OneToMany changes (after all entities exist).
        // Unidirectional @OneToMany @JoinColumn stores FK on child table, but child entity
        // has no @ManyToOne back-reference. We must defer these FK UPDATEs until all child
        // entities have been created in the first pass.
        if (!oneToManyChanges.isEmpty()) {
            log.debug("Second pass: applying {} OneToMany changes", oneToManyChanges.size());

            Map<String, Map<Long, List<FieldChange>>> oneToManyByEntity = oneToManyChanges.stream()
                .collect(Collectors.groupingBy(
                    FieldChange::getEntityType,
                    Collectors.groupingBy(FieldChange::getEntityId)
                ));

            for (Map.Entry<String, Map<Long, List<FieldChange>>> entityEntry : oneToManyByEntity.entrySet()) {
                String entityType = entityEntry.getKey();
                Map<Long, List<FieldChange>> changesById = entityEntry.getValue();

                List<Long> entityIds = new ArrayList<>(changesById.keySet());
                Map<String, FieldChange> latestChangesMap = batchFetchLatestChanges(entityType, entityIds);

                for (Map.Entry<Long, List<FieldChange>> idEntry : changesById.entrySet()) {
                    Long entityId = idEntry.getKey();
                    List<FieldChange> changes = idEntry.getValue();

                    // Resolve remapped parent ID (dedup may have redirected)
                    Long resolvedId = DedupKeyResolver.resolveRemappedId(entityType, entityId, idRemapTable);

                    // Parent entity must exist to set FK on children
                    SyncableService service = serviceFacade.getService(entityType);
                    if (service == null) {
                        // No registered service for this type — permanent, like the batched NO_SERVICE
                        // path. Record it (was an unnoted continue) so the ledger is total.
                        noteAll(changes, ChangeDisposition.DEAD_LETTER);
                        continue;
                    }
                    BaseIdEntity parentEntity = (BaseIdEntity) service.getEntityById(resolvedId);
                    if (parentEntity == null) {
                        log.debug("OneToMany parent {}#{} not found, deferring to next sync", entityType, resolvedId);
                        changes.forEach(this::markDeferred); // don't ack — retry once the parent arrives (D6)
                        continue;
                    }

                    for (FieldChange change : changes) {
                        boolean shouldApply = shouldApplyChange(change, latestChangesMap);
                        log.debug("OneToMany {}.{} #{}: shouldApply={}, newValue={}",
                            entityType, change.getFieldName(), resolvedId, shouldApply,
                            change.getNewValue() != null ? change.getNewValue().substring(0, Math.min(100, change.getNewValue().length())) : "null");
                        if (shouldApply) {
                            boolean applied = applyFieldChange(parentEntity, change, null, idRemapTable);
                            log.debug("OneToMany {}.{} #{}: applied={}", entityType, change.getFieldName(), resolvedId, applied);
                            if (applied) {
                                saveIncomingChange(change);
                                totalApplied++;
                                // Totality (Inc 7): this convergence site incremented the count without
                                // recording a disposition, so the durable hub apply-state row would stay
                                // PENDING forever and eventually dead-letter an APPLIED change.
                                note(change, ChangeDisposition.APPLIED);
                            } else {
                                // Children missing — deferred; don't ack so the hub re-sends it (D6).
                                // (Only reached when shouldApply is true, i.e. not an LWW-supersede.)
                                markDeferred(change);
                            }
                        } else {
                            // Lost LWW — already converged, nothing to apply. Record it so the ledger is
                            // total (was an unnoted no-else branch).
                            note(change, ChangeDisposition.NOOP_SUPERSEDED);
                        }
                    }
                }
            }
        }

        // THIRD PASS: Process ManyToMany changes (after all entities exist)
        if (!manyToManyChanges.isEmpty()) {
            log.debug("Third pass: applying {} ManyToMany changes", manyToManyChanges.size());

            // Group ManyToMany changes by entity
            Map<String, Map<Long, List<FieldChange>>> manyToManyByEntity = manyToManyChanges.stream()
                .collect(Collectors.groupingBy(
                    FieldChange::getEntityType,
                    Collectors.groupingBy(FieldChange::getEntityId)
                ));

            for (Map.Entry<String, Map<Long, List<FieldChange>>> entityEntry : manyToManyByEntity.entrySet()) {
                String entityType = entityEntry.getKey();
                Map<Long, List<FieldChange>> changesById = entityEntry.getValue();

                List<Long> entityIds = new ArrayList<>(changesById.keySet());
                Map<String, FieldChange> latestChangesMap = batchFetchLatestChanges(entityType, entityIds);

                for (Map.Entry<Long, List<FieldChange>> idEntry : changesById.entrySet()) {
                    Long entityId = idEntry.getKey();
                    List<FieldChange> changes = idEntry.getValue();

                    // Pass null for failedManyToOneRefs - ManyToMany uses different logic
                    int applied = applyEntityChangesBatched(entityType, entityId, changes, latestChangesMap, null, idRemapTable);
                    totalApplied += applied;

                    if (applied > 0) {
                        final String type = entityType;
                        final Long id = entityId;
                        final List<FieldChange> changeList = new ArrayList<>(changes);
                        pendingBroadcasts.add(() -> syncUpdateController.broadcastEntityUpdate(type, id, changeList));
                    }
                }
            }
        }

        // FOURTH PASS: Retry failed ManyToOne references now that all entities should exist.
        // IMPORTANT: Entities stored in failedManyToOneRefs may have been DETACHED by
        // entityManager.clear() calls during createEntityFromSync(). We must re-load them
        // from the database to get a managed instance before modifying and saving.
        if (!failedManyToOneRefs.isEmpty()) {
            try {
                entityManager.flush(); // Ensure all entities are persisted before retry
            } catch (Exception e) {
                log.warn("Flush failed before ManyToOne retry pass: {}", e.getMessage());
                entityManager.clear();
            }
            log.debug("Third pass: retrying {} failed ManyToOne references", failedManyToOneRefs.size());

            for (FailedManyToOneReference failedRef : failedManyToOneRefs) {
                try {
                    // Resolve remapped IDs before retry
                    String refTypeName = failedRef.field.getType().getSimpleName();
                    Long referencedId = DedupKeyResolver.resolveRemappedId(refTypeName, failedRef.referencedId, idRemapTable);
                    String entityType = failedRef.change.getEntityType();
                    Long ownerEntityId = DedupKeyResolver.resolveRemappedId(entityType, failedRef.entity.getId(), idRemapTable);

                    // Re-fetch the referenced entity - it should exist now
                    Object referencedEntity = entityManager.find(failedRef.field.getType(), referencedId);

                    if (referencedEntity != null) {
                        // Re-load the owning entity to get a MANAGED instance.
                        // The original failedRef.entity may be detached due to entityManager.clear()
                        // calls in createEntityFromSync(). Setting a field on a detached entity
                        // via reflection does NOT persist the change.
                        SyncableService service = serviceFacade.getService(entityType);
                        if (service == null) {
                            log.warn("No service for {} - cannot retry ManyToOne reference", entityType);
                            // No service for the owner type — permanent. Record it (was an unnoted
                            // continue) so the ledger is total.
                            note(failedRef.change, ChangeDisposition.DEAD_LETTER);
                            continue;
                        }

                        BaseIdEntity managedEntity = (BaseIdEntity) service.getEntityById(ownerEntityId);
                        if (managedEntity == null) {
                            log.warn("Could not re-load {}#{} for ManyToOne retry",
                                entityType, ownerEntityId);
                            // The owner row isn't loadable yet — likely still arriving. Retryable, not
                            // resolved. Record DEFERRED (was an unnoted continue) so the ledger is total.
                            note(failedRef.change, ChangeDisposition.DEFERRED);
                            continue;
                        }

                        failedRef.field.setAccessible(true);
                        failedRef.field.set(managedEntity, referencedEntity);
                        service.save(managedEntity);
                        saveIncomingChange(failedRef.change);
                        totalApplied++;
                        // Totality (Inc 7): the retry that finally set the FK must record APPLIED. The
                        // ManyToOne-missing path in applyFieldChange returns false WITHOUT noting (it just
                        // queues the ref here), so this pass is the only place it can be classified.
                        note(failedRef.change, ChangeDisposition.APPLIED);
                        log.debug("Retry succeeded: set {}.{} -> entity #{}",
                            entityType, failedRef.change.getFieldName(), referencedId);
                    } else {
                        log.debug("Retry failed: referenced entity {}#{} still not found (will resolve in next sync)",
                            refTypeName, referencedId);
                        markDeferred(failedRef.change); // don't ack — retry once the referenced entity arrives (D6)
                    }
                } catch (Exception e) {
                    log.error("Error retrying ManyToOne reference {}.{}: {}",
                        failedRef.change.getEntityType(),
                        failedRef.change.getFieldName(),
                        e.getMessage());
                    // Totality (Inc 7): a thrown retry is a transient failure, not a resolution — record
                    // FAILED_RETRYABLE so the change is rescanned, not left silently unclassified.
                    note(failedRef.change, ChangeDisposition.FAILED_RETRYABLE);
                }
            }
        }

        // Log batch summary
        log.info("peer_sync.batch.complete applied={} total={} deferredManyToOne={}",
            totalApplied, incomingChanges.size(), failedManyToOneRefs.size());

        // Register callback to broadcast AFTER transaction commits
        // This ensures frontend API calls will see the committed data
        if (!pendingBroadcasts.isEmpty() && TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    log.debug("Transaction committed, broadcasting {} entity updates", pendingBroadcasts.size());
                    pendingBroadcasts.forEach(Runnable::run);

                    // Publish FileObject sync event for file download handling
                    if (!fileObjectChanges.isEmpty()) {
                        log.debug("Publishing FileObjectSyncEvent with {} changes", fileObjectChanges.size());
                        eventPublisher.publishEvent(
                            new FileObjectSyncHandler.FileObjectSyncEvent(fileObjectChanges, "sync"));
                    }

                    // Handle Value name changes (delete old Vendor/FileType folders)
                    // Run in a new transaction since afterCommit runs outside transaction context
                    if (!valueNameChanges.isEmpty()) {
                        try {
                            transactionTemplate.executeWithoutResult(status -> {
                                handleValueNameChangesForFileStructure(valueNameChanges);
                            });
                        } catch (Exception e) {
                            log.error("Value name change transaction failed: {}", e.getMessage(), e);
                        }
                    }

                    // Merge duplicates — hub only. Clients receive merge results via sync.
                    // Running dedup on both sides causes conflicting decisions (hub keeps A,
                    // client keeps B → both delete the other's pick).
                    if (syncConfig.isHubMode() && mergeInProgress.compareAndSet(false, true)) {
                        try {
                            runMergeCascade();
                        } finally {
                            mergeInProgress.set(false);
                        }
                    } else {
                        log.debug("Merge already in progress on another thread, skipping");
                    }
                }
            });
        } else {
            // No active transaction synchronization, broadcast immediately (fallback)
            pendingBroadcasts.forEach(Runnable::run);

            // Publish FileObject sync event
            if (!fileObjectChanges.isEmpty()) {
                eventPublisher.publishEvent(
                    new FileObjectSyncHandler.FileObjectSyncEvent(fileObjectChanges, "sync"));
            }

            // Handle Value name changes (delete old Vendor/FileType folders)
            if (!valueNameChanges.isEmpty()) {
                handleValueNameChangesForFileStructure(valueNameChanges);
            }

            // Merge duplicates — same guard as afterCommit path
            if (mergeInProgress.compareAndSet(false, true)) {
                try {
                    runMergeCascade();
                } finally {
                    mergeInProgress.set(false);
                }
            }
        }

        // Totality gate (Inc 7): the durable hub apply-state is only trustworthy if EVERY input change
        // ends this run with a disposition — an unclassified change leaves its co-committed PENDING row
        // un-flipped forever and would eventually dead-letter a change that actually applied. This does
        // not fix anything; it makes any remaining gap LOUD and countable, and a clean soak (zero gaps,
        // with sync.hub.apply-lww-enabled=true) is the hard precondition for turning the durable path on.
        assertLedgerTotality(incomingChanges);

        return totalApplied;
    }

    // Counts input changes that finished an apply run with NO disposition (a ledger-totality gap).
    // Must stay 0 in a soak before sync.hub.durable-apply-state-enabled is turned on.
    private final java.util.concurrent.atomic.AtomicLong ledgerTotalityGaps =
            new java.util.concurrent.atomic.AtomicLong();

    public long getLedgerTotalityGapCount() {
        return ledgerTotalityGaps.get();
    }

    /**
     * Assert every non-null input change was classified this run. Observer only — never throws, never
     * alters control flow. A gap is logged at ERROR (with the change coordinates) and counted so a soak
     * can prove totality before the durable apply-state path is enabled.
     */
    private void assertLedgerTotality(List<FieldChange> incomingChanges) {
        if (currentLedger == null || incomingChanges == null) return;
        for (FieldChange change : incomingChanges) {
            if (change == null) continue;
            if (currentLedger.of(change) == null) {
                ledgerTotalityGaps.incrementAndGet();
                log.error("sync.apply.totality_gap entityType={} entityId={} field={} changeType={} — "
                        + "change ended the apply run with NO disposition; durable apply-state would leave "
                        + "it PENDING. Do NOT enable sync.hub.durable-apply-state-enabled until this is 0.",
                        change.getEntityType(), change.getEntityId(), change.getFieldName(),
                        change.getChangeType());
            }
        }
    }

    /**
     * Run the registered merge services in order. Lock-contention exceptions
     * (OptimisticLock / PessimisticLock / Hibernate LockAcquisition / Spring
     * CannotAcquireLock) are logged at debug and swallowed — the next sync cycle
     * will retry. Every other exception is logged at ERROR with a stack trace
     * before being rethrown so a real fault (schema drift, repoint failure,
     * verify-before-delete blocking a delete) surfaces in logs/CI instead of
     * silently masquerading as "contention" forever.
     */
    private void runMergeCascade() {
        try {
            categoryValueMergeService.mergeIfDuplicatesExist();
            workRequestMergeService.mergeIfDuplicatesExist();
            jhaMergeService.mergeIfDuplicatesExist();
            emailCorrespondenceMergeService.mergeIfDuplicatesExist();
            userMergeService.mergeIfDuplicatesExist();
            instrumentMergeService.mergeIfDuplicatesExist();
            instrumentLogMergeService.mergeIfDuplicatesExist();
            conversationMergeService.mergeIfDuplicatesExist();
            messageMergeService.mergeIfDuplicatesExist();
            // Reload remap table — merges may have persisted new remaps
            idRemapTable = loadPersistentRemaps();
        } catch (RuntimeException e) {
            if (isLockContention(e)) {
                log.debug("Merge skipped due to contention (will retry next cycle): {}", e.getMessage());
                return;
            }
            log.error("Merge cascade failed (non-contention) — surface this fault", e);
            throw e;
        }
    }

    /**
     * Walk the exception chain looking for any known lock-contention signal.
     * Anything else is a real fault and must not be silently swallowed.
     */
    private boolean isLockContention(Throwable t) {
        for (Throwable cur = t; cur != null; cur = cur.getCause()) {
            if (cur instanceof jakarta.persistence.OptimisticLockException) return true;
            if (cur instanceof jakarta.persistence.PessimisticLockException) return true;
            if (cur instanceof org.hibernate.exception.LockAcquisitionException) return true;
            if (cur instanceof org.springframework.dao.CannotAcquireLockException) return true;
            if (cur instanceof org.springframework.dao.PessimisticLockingFailureException) return true;
        }
        return false;
    }

    /**
     * Handle Value name changes that affect file structure.
     * When a Vendor or FileType name changes:
     * 1. Find all FileObjects that reference this Value
     * 2. Queue file downloads for each (files will download to NEW path based on new name)
     * 3. Delete old folders (files are at old path, new files will be downloaded)
     *
     * This is necessary because when Vendor/FileType name changes, no FileObject field changes
     * are generated, so the normal file sync doesn't trigger. But the files on the sync server
     * are already at the new path (uploaded from source machine after rename).
     */
    private void handleValueNameChangesForFileStructure(List<FieldChange> valueNameChanges) {
        if (valueNameChanges.isEmpty()) {
            return;
        }

        for (FieldChange change : valueNameChanges) {
            try {
                // Look up the Value entity to get its category
                // Use EntityManager.find() to bypass @Where(clause = "deleted = false")
                Value value = entityManager.find(Value.class, change.getEntityId());

                if (value == null || value.getCategory() == null) {
                    continue;
                }

                String categoryName = value.getCategory().getName();
                if ("Vendor".equals(categoryName) || "File Type".equals(categoryName)) {
                    String oldName = change.getOldValue().replace("\"", "");

                    // Find all FileObjects that reference this Value
                    // Use queries with fetch joins to ensure vendor and fileType are eagerly loaded
                    List<FileObject> affectedFiles;
                    if ("Vendor".equals(categoryName)) {
                        affectedFiles = fileRepo.findByVendorWithRelationships(value);
                    } else {
                        affectedFiles = fileRepo.findByFileTypeWithRelationships(value);
                    }

                    log.debug("{} name change '{}' -> '{}': queueing downloads for {} files",
                        categoryName, oldName, value.getName(), affectedFiles.size());

                    // Queue file downloads for each affected FileObject
                    // Files on sync server are at NEW path, local files are at OLD path
                    // Download will get files to new location
                    // OLD folders will be deleted AFTER download completes (not immediately!)
                    for (FileObject fileObject : affectedFiles) {
                        try {
                            // Build old folder paths for this FileObject (to delete after download)
                            String oldFolderPaths = buildOldFolderPaths(fileObject, oldName, categoryName);
                            fileObjectSyncHandler.queueFileDownloadWithCleanup(fileObject, oldFolderPaths);
                        } catch (Exception e) {
                            log.warn("Failed to queue download for FileObject #{}: {}",
                                fileObject.getId(), e.getMessage());
                        }
                    }
                }
            } catch (Exception e) {
                log.error("Error handling Value name change for file structure: {}", e.getMessage(), e);
            }
        }
    }

    /**
     * Build old folder paths for a FileObject based on the old Vendor/FileType name.
     * Returns semicolon-separated paths for each extension the FileObject has.
     *
     * File structure: uploads/{extension}/{fileType}/{vendor}/
     * - When Vendor changes: old folder is uploads/{ext}/{fileType}/{oldVendorName}/
     * - When FileType changes: old folder is uploads/{ext}/{oldFileTypeName}/{vendor}/
     */
    private String buildOldFolderPaths(FileObject fileObject, String oldName, String categoryName) {
        List<String> extensions = fileObject.getExtensionsArray();
        if (extensions == null || extensions.isEmpty()) {
            return "";
        }

        List<String> oldPaths = new ArrayList<>();
        String baseLink = fileObject.getBaseLink() != null ? fileObject.getBaseLink() : "uploads";

        for (String ext : extensions) {
            String trimmedExt = ext.trim();
            if (trimmedExt.isEmpty()) continue;

            String oldFolderPath;
            if ("Vendor".equals(categoryName)) {
                // Vendor name changed - build path with old vendor name
                String fileTypeName = fileObject.getFileType() != null ? fileObject.getFileType().getName() : "";
                oldFolderPath = baseLink + "/" + trimmedExt + "/" + fileTypeName + "/" + oldName;
            } else {
                // FileType name changed - build path with old file type name
                String vendorName = fileObject.getVendor() != null ? fileObject.getVendor().getName() : "";
                oldFolderPath = baseLink + "/" + trimmedExt + "/" + oldName + "/" + vendorName;
            }
            oldPaths.add(oldFolderPath);
        }

        return String.join(";", oldPaths);
    }

    /**
     * Batch fetch latest changes for multiple entities of the same type.
     * Returns a map keyed by "entityType:entityId:fieldName".
     */
    private Map<String, FieldChange> batchFetchLatestChanges(String entityType, List<Long> entityIds) {
        if (entityIds.isEmpty()) {
            return Collections.emptyMap();
        }

        List<FieldChange> latestChanges = fieldChangeRepository.findLatestChangesForEntities(entityType, entityIds);

        return latestChanges.stream()
            .collect(Collectors.toMap(
                FieldChange::buildChangeKey,
                fc -> fc,
                SyncOrder::max // one total order; on a tie the old `? a : b` kept an arbitrary DB row
            ));
    }

    /**
     * Apply changes to a single entity using LWW per field with pre-fetched latest changes.
     * This version uses a pre-populated map to avoid N+1 queries.
     *
     * Pre-save dedup: Before creating a new entity, checks if an entity with the same
     * natural key already exists. If so, redirects the CREATE to an UPDATE on the existing
     * entity and records the ID mapping in idRemapTable for downstream reference resolution.
     *
     * @param failedManyToOneRefs Optional list to collect failed ManyToOne references for retry.
     *                            Pass null to skip collection (e.g., during retry pass).
     * @param idRemapTable        In-batch ID remap table for dedup redirects.
     */
    @SuppressWarnings("unchecked")
    private int applyEntityChangesBatched(String entityType, Long entityId, List<FieldChange> changes,
                                          Map<String, FieldChange> latestChangesMap,
                                          List<FailedManyToOneReference> failedManyToOneRefs,
                                          Map<String, Map<Long, Long>> idRemapTable) {
        int appliedCount = 0;

        try {
            SyncableService service = serviceFacade.getService(entityType);
            if (service == null) {
                // Fail-loud: an unregistered entity type is a permanent (dead-letter) condition — NOT a
                // silent drop. Previously this logged at WARN and returned 0; the change was never marked
                // received, so it re-arrived and re-dropped forever (the LotoStandardApprovalEvent /
                // ShiftDay / WorkCategoryProfile class of data loss). Record it so it is visible and
                // replayable once the type is registered. The startup SyncRegistryValidator prevents most
                // of these from ever reaching here.
                log.error("sync.dead_letter reason=NO_SERVICE entityType={} entityId={} changes={} — "
                        + "type is not registered (EntityTableRegistry + ServiceFacade); dead-lettering",
                        entityType, entityId, changes.size());
                syncDeadLetterService.recordNoService(entityType, changes);
                noteAll(changes, ChangeDisposition.DEAD_LETTER);
                return 0;
            }

            // Get current entity. If this incoming ID was previously deduplicated
            // to a local canonical row, apply subsequent updates/relationships to
            // that canonical owner. This is especially important for ManyToMany
            // rows that can arrive after the owner CREATE was remapped.
            Long targetEntityId = DedupKeyResolver.resolveRemappedId(entityType, entityId, idRemapTable);
            BaseIdEntity entity = (BaseIdEntity) service.getEntityById(targetEntityId);
            if (!Objects.equals(targetEntityId, entityId)) {
                log.info("Applying {}#{} change(s) to remapped owner #{}",
                    entityType, entityId, targetEntityId);
            }

            // Check for DELETE changes first
            boolean hasDelete = changes.stream()
                .anyMatch(c -> c.getChangeType() == FieldChange.ChangeType.DELETE
                          && "_entity_".equals(c.getFieldName()));

            if (hasDelete && entity != null) {
                // Apply field changes BEFORE soft delete to preserve data state
                // This ensures the entity has the same field values as the source
                for (FieldChange change : changes) {
                    if (!"_entity_".equals(change.getFieldName()) &&
                        !"deleted".equals(change.getFieldName())) {
                        // Pass null for failedManyToOneRefs - no retry needed for deleted entities
                        applyFieldChange(entity, change, null, idRemapTable);
                        saveIncomingChange(change);
                        appliedCount++;
                        // Mirror the count exactly: this branch increments without checking
                        // applyFieldChange's result, so a field that silently failed is still counted.
                        // Recorded as-is rather than "corrected" — the discrepancy is real and belongs to
                        // the DELETE-ordering work, not to an observer.
                        note(change, ChangeDisposition.APPLIED);
                    } else if (!"_entity_".equals(change.getFieldName())) {
                        // A standalone 'deleted' field change: the soft-delete below converges it, so it
                        // is already resolved. Record it (was skipped unnoted) to keep the ledger total.
                        note(change, ChangeDisposition.NOOP_SUPERSEDED);
                    }
                }

                // Now apply soft delete
                entity.setDeleted(true);
                service.save(entity);
                FieldChange deleteMarker = changes.stream()
                    .filter(c -> c.getChangeType() == FieldChange.ChangeType.DELETE)
                    .findFirst().orElse(null);
                saveIncomingChange(deleteMarker);
                note(deleteMarker, ChangeDisposition.APPLIED);
                return appliedCount + 1;
            }

            // Handle entity creation if entity doesn't exist
            if (entity == null) {
                boolean hasCreate = changes.stream()
                    .anyMatch(c -> c.getChangeType() == FieldChange.ChangeType.CREATE
                              && "_entity_".equals(c.getFieldName()));

                if (!hasCreate) {
                    boolean relationshipOnly = changes.stream()
                        .anyMatch(c -> c.getRelationshipType() != null);
                    if (relationshipOnly) {
                        log.warn("Entity {}#{} not found for relationship change(s) {} and no CREATE present; deferring",
                            entityType, entityId,
                            changes.stream().map(FieldChange::getFieldName).toList());
                    } else {
                        log.debug("Entity {}#{} not found and no CREATE change present, skipping", entityType, entityId);
                    }
                    // The parent hasn't arrived yet — retryable, not resolved. The WARN above already
                    // says "deferring", but nothing ever deferred it: there is no markDeferred here, so
                    // the receiver acks it and the hub never re-sends. Recording the truth is the whole
                    // point of this ledger; acting on it is the next increment.
                    noteAll(changes, ChangeDisposition.DEFERRED);
                    return 0;
                }

                // Check for soft-deleted entity (hidden by @Where clause)
                String tableName = getTableName(entityType);
                Long existingCount = ((Number) entityManager.createNativeQuery(
                    "SELECT COUNT(*) FROM " + tableName + " WHERE id = :id")
                    .setParameter("id", entityId).getSingleResult()).longValue();

                if (existingCount > 0) {
                    // Row exists but is soft-deleted — check LWW before re-activating.
                    // The merge service may have intentionally soft-deleted this entity (dedup).
                    // If the local "deleted=true" change is newer than the incoming CREATE,
                    // the deletion wins — don't re-activate or we get an infinite oscillation.
                    String deletedKey = FieldChange.buildChangeKey(entityType, entityId, "deleted");
                    FieldChange localDeletedChange = latestChangesMap.get(deletedKey);
                    FieldChange incomingCreate = changes.stream()
                        .filter(c -> c.getChangeType() == FieldChange.ChangeType.CREATE
                                  && "_entity_".equals(c.getFieldName()))
                        .findFirst().orElse(null);

                    // Does the local deletion outrank the incoming re-create by the ONE total order?
                    // The old test (`!incoming.isAfter(localDeleted)`) made the local deletion win on a
                    // TIE — and "is my deletion not-older than their create" is machine-relative, so two
                    // nodes reached OPPOSITE states from the identical pair. SyncOrder gives both the same
                    // verdict. (This only changes the equal-timestamp case; strictly-newer/older is
                    // unchanged. Whether a deletion should still win when it is OLDER is a separate question.)
                    boolean localDeletionIsNewer = localDeletedChange != null
                        && "true".equals(localDeletedChange.getNewValue())
                        && incomingCreate != null
                        && SyncOrder.TOTAL.compare(localDeletedChange, incomingCreate) > 0;

                    if (localDeletionIsNewer) {
                        // Local deletion wins — save incoming changes as received (so they stop
                        // arriving) but don't re-activate the entity.
                        log.info("Skipping re-activation of {}#{} — local deletion is newer " +
                            "(local: {}, incoming: {})", entityType, entityId,
                            localDeletedChange.getTimestamp(), incomingCreate.getTimestamp());
                        for (FieldChange change : changes) {
                            saveIncomingChange(change);
                        }
                        // Already converged: the local deletion wins, so NOTHING was applied to entity
                        // state. The count returned here says otherwise (changes.size()), which is what
                        // fires a spurious "entity updated" broadcast at the caller. Left intact —
                        // observer only — but recorded honestly.
                        noteAll(changes, ChangeDisposition.NOOP_SUPERSEDED);
                        return changes.size();
                    }

                    // Local deletion is older or doesn't exist — re-activate
                    entityManager.createNativeQuery(
                        "UPDATE " + tableName + " SET deleted = false, date_modified = :now WHERE id = :id")
                        .setParameter("id", entityId)
                        .setParameter("now", java.time.LocalDateTime.now()).executeUpdate();
                    entityManager.flush();
                    entityManager.clear();
                    entity = (BaseIdEntity) service.getEntityById(entityId);
                    log.debug("Re-activated soft-deleted entity {}#{}", entityType, entityId);
                } else {
                    // ===== PRE-SAVE DEDUP CHECK =====
                    // Before creating, check if an entity with the same natural key already exists.
                    // If so, redirect this CREATE to an UPDATE on the existing entity.
                    Long existingDupId = dedupKeyResolver.findExistingByNaturalKey(
                        entityType, entityId, changes, idRemapTable);

                    if (existingDupId != null) {
                        // REDIRECT: Don't create a duplicate. Apply changes to existing entity via LWW.
                        log.debug("Pre-save dedup: {}#{} matches existing #{}. Redirecting.",
                            entityType, entityId, existingDupId);
                        idRemapTable.computeIfAbsent(entityType, k -> new HashMap<>())
                            .put(entityId, existingDupId);
                        // Persist so future batches can resolve references to this ID
                        persistDedupRemap(entityType, entityId, existingDupId);

                        entity = (BaseIdEntity) service.getEntityById(existingDupId);
                        if (entity == null) {
                            log.warn("Pre-save dedup: existing entity {}#{} not found after dedup query — skipping",
                                entityType, existingDupId);
                            for (FieldChange change : changes) {
                                saveIncomingChange(change);
                            }
                            // The dedup target vanished between the query and the fetch — retrying can't
                            // fix it, and these changes are already marked received. Permanent.
                            noteAll(changes, ChangeDisposition.DEAD_LETTER);
                            return 0;
                        }

                        // Fetch LWW history for the EXISTING entity (not the incoming one)
                        Map<String, FieldChange> existingLatestMap =
                            batchFetchLatestChanges(entityType, List.of(existingDupId));

                        // Apply field changes via LWW to the existing entity
                        boolean modified = false;
                        for (FieldChange change : changes) {
                            if ("_entity_".equals(change.getFieldName())) {
                                // The CREATE marker of a change-set redirected onto an existing row: the
                                // create is superseded by the existing entity. Record it (was an unnoted
                                // continue) so the ledger is total.
                                note(change, ChangeDisposition.NOOP_SUPERSEDED);
                                continue;
                            }
                            if (shouldApplyChange(change, existingLatestMap)) {
                                // In-batch LWW: record the winner so a later same-field change in this
                                // batch is compared against it, not the stale snapshot (see the main
                                // existing-entity loop). existingLatestMap is used only in this loop.
                                existingLatestMap.put(change.buildChangeKey(), change);
                                boolean applied = applyFieldChange(entity, change, failedManyToOneRefs, idRemapTable);
                                if (applied) {
                                    modified = true;
                                    note(change, ChangeDisposition.APPLIED);
                                }
                                // applied==false is classified inside applyFieldChange, which knows WHY.
                            } else {
                                note(change, ChangeDisposition.NOOP_SUPERSEDED);
                            }
                        }

                        if (modified) {
                            service.save(entity);
                            entityManager.flush();
                        }

                        // Mark ALL incoming changes as received (stops retransmission)
                        for (FieldChange change : changes) {
                            saveIncomingChange(change);
                        }
                        return changes.size();
                    }

                    // ===== NORMAL CREATE PATH =====
                    // No natural key duplicate — create the entity normally
                    entity = (BaseIdEntity) service.getEntity();
                    entity.setId(entityId);

                    // Apply ALL field changes to the in-memory entity BEFORE persist.
                    // This ensures NOT NULL columns have real values (no dummy defaults).
                    // In-batch LWW via a LOCAL copy of the latest-map refreshed in-loop: when a batch
                    // carries two changes to the SAME field out of timestamp order, only the winner is
                    // applied to the entity. A local copy (not the shared map) is used so the separate
                    // save/count loop below still sees the original map — that loop must save+ack ALL
                    // changes, and would mis-classify the winner as superseded if it saw the mutated map.
                    Map<String, FieldChange> createApplyMap = new HashMap<>(latestChangesMap);
                    for (FieldChange change : changes) {
                        if (!"_entity_".equals(change.getFieldName())
                                && shouldApplyChange(change, createApplyMap)) {
                            createApplyMap.put(change.buildChangeKey(), change);
                            applyFieldChange(entity, change, failedManyToOneRefs, idRemapTable);
                        }
                    }

                    entityManager.merge(entity);
                    entityManager.flush();  // Force immediate INSERT — prevents cascade PK violations
                    log.debug("Created new entity {}#{} from sync", entityType, entityId);
                }

                // Advance the shared id_seq if this entity's ID falls in our device's range.
                // Sync creates entities with pre-set IDs (bypassing the ID generator), so the
                // sequence isn't incremented. Without this, local inserts can generate IDs that
                // collide with synced entities (PK violation on saveAndFlush).
                advanceSequencePastIfNeeded(entityId);

                // Save the CREATE change record. Must be the _entity_ marker SPECIFICALLY: on a fresh
                // entity EVERY field change is CREATE-typed (coordinates/name/deleted/... are all CREATE,
                // not just the marker), so filtering on changeType alone picks an arbitrary field and
                // leaves the real _entity_ marker with no disposition — a totality gap that strands its
                // co-committed durable apply-state row at PENDING forever (the rescan then reapplies it
                // every cycle and it never resolves). The DELETE path at the top of this method is already
                // marker-specific for exactly this reason. We only reach here when hasCreate was true,
                // which required an _entity_ CREATE to exist, so this find is non-null.
                FieldChange createMarker = changes.stream()
                    .filter(c -> c.getChangeType() == FieldChange.ChangeType.CREATE
                              && "_entity_".equals(c.getFieldName()))
                    .findFirst().orElse(null);
                saveIncomingChange(createMarker);
                appliedCount++;
                note(createMarker, ChangeDisposition.APPLIED);

                // For new entities, field changes were already applied above.
                // Save field change records and return.
                for (FieldChange change : changes) {
                    if (!"_entity_".equals(change.getFieldName())
                            && shouldApplyChange(change, latestChangesMap)) {
                        saveIncomingChange(change);
                        appliedCount++;
                        // Counted applied on the LWW verdict alone — this branch never checks
                        // applyFieldChange's result. A change recorded here can still be deferred by the
                        // later ManyToOne retry pass; DispositionLedger's precedence (DEFERRED outranks
                        // APPLIED) makes that outcome order-independent.
                        note(change, ChangeDisposition.APPLIED);
                    } else if (!"_entity_".equals(change.getFieldName())) {
                        note(change, ChangeDisposition.NOOP_SUPERSEDED);
                    }
                }
                return appliedCount;
            }

            // Apply field changes to EXISTING entity using LWW with pre-fetched map
            // IMPORTANT: Do NOT call saveIncomingChange() here — it triggers Hibernate auto-flush,
            // which pushes the dirty entity UPDATE to the DB before our explicit flush().
            // If the entity has a unique constraint conflict (e.g., duplicate email), the auto-flush
            // exception fires outside the try-catch, poisoning the entire batch.
            // Instead, collect applied changes and save them AFTER the flush succeeds.
            boolean modified = false;
            List<FieldChange> appliedChanges = new java.util.ArrayList<>();
            for (FieldChange change : changes) {
                if ("_entity_".equals(change.getFieldName())) {
                    // Totality (Inc 7): an entity-level marker on an already-existing entity is a no-op
                    // (the row is already there). Record it so every input change has a disposition.
                    note(change, ChangeDisposition.NOOP_SUPERSEDED);
                    continue; // Skip entity-level markers
                }

                // Check if we should apply this change (LWW) using pre-fetched map
                if (shouldApplyChange(change, latestChangesMap)) {
                    // This change won LWW — make the in-batch map reflect it so a LATER change to the
                    // SAME field in this same batch is compared against THIS winner, not the now-stale DB
                    // snapshot. Without it, two changes to one field resolve by list order rather than by
                    // SyncOrder whenever the batch isn't timestamp-ordered (SSE fast-path / resync): a
                    // newer change applied first could then be overwritten by an older one arriving later
                    // in the list. Recorded on the LWW verdict (not applyFieldChange's result) so a
                    // deferred winner still blocks an older sibling.
                    latestChangesMap.put(change.buildChangeKey(), change);
                    boolean applied = applyFieldChange(entity, change, failedManyToOneRefs, idRemapTable);
                    if (applied) {
                        modified = true;
                        appliedChanges.add(change);
                        note(change, ChangeDisposition.APPLIED);
                    }
                    // applied==false is NOT classified here: applyFieldChange knows whether it was a
                    // missing ManyToOne (deferred, retried in pass 4), an unknown field (dead-letter) or
                    // a transient failure. Recording a guess here would race the precedence rule.
                } else {
                    log.debug("Skipping change for {}.{} - local change is newer or equal",
                        entityType, change.getFieldName());
                    note(change, ChangeDisposition.NOOP_SUPERSEDED);
                }
            }

            if (modified) {
                service.save(entity);
                entityManager.flush(); // Flush immediately — dedup prevents constraint violations
                // Flush succeeded — now safe to mark changes as received
                for (FieldChange change : appliedChanges) {
                    saveIncomingChange(change);
                }
                appliedCount += appliedChanges.size();
                log.debug("Applied {} changes to {}#{}", appliedCount, entityType, entityId);
            }

        } catch (Exception e) {
            log.error("Error applying changes to {}#{}: {}", entityType, entityId, e.getMessage());
            throw e; // Propagate — let the caller handle
        }

        return appliedCount;
    }

    /**
     * Determine if an incoming change should be applied based on Last-Writer-Wins (LWW).
     * Uses pre-fetched map to eliminate N+1 query problem.
     *
     * @param incoming The incoming change to evaluate
     * @param latestChangesMap Pre-fetched map of latest local changes (key: entityType:entityId:fieldName)
     * @return true if the incoming change should be applied
     */
    private boolean shouldApplyChange(FieldChange incoming, Map<String, FieldChange> latestChangesMap) {
        // Legacy hub behavior (flag off, the default): the hub already saved these rows, so apply them
        // without LWW. Definitionally-latest for a single exchange, but blind across CONCURRENT
        // exchanges — an older change can then overwrite a newer one on the hub. hubApplyLwwEnabled
        // turns on the real LWW below; the persist-skip (saveIncomingChange) is unaffected either way.
        if (skipSaveFieldChanges && !hubApplyLwwEnabled) {
            return true;
        }

        // Under the OR-Set, owning-side @ManyToMany membership applies via a per-element LWW-Element-Set
        // (see applyManyToManyChange) that converges regardless of order — so it must NOT be gated by
        // change-level LWW here, which would discard a concurrent edit before its per-element merge. The
        // per-element max inside the OR-Set is the real conflict resolution; this is why it is safe to
        // bypass (unlike the reverted naive delta, which bypassed LWW with no per-element resolution).
        if (membershipOrsetEnabled && "ManyToMany".equals(incoming.getRelationshipType())) {
            return true;
        }

        String key = incoming.buildChangeKey();
        FieldChange local = latestChangesMap.get(key);

        // IDENTITY SHORT-CIRCUIT (essential on the hub path, where a change is compared against its OWN
        // just-saved row): the same global id means `local` IS `incoming`, so apply it. Without this the
        // hub would compare a change against itself (SyncOrder.compare == 0 -> not > 0 -> false) and
        // SILENTLY APPLY NOTHING while still returning success/broadcasting — a total, invisible outage.
        // Inc 4 guarantees the hub preserves the origin id on its saved row, so the ids match.
        if (skipSaveFieldChanges && local != null && incoming.getId() != null
                && incoming.getId().equals(local.getId())) {
            return true;
        }

        // One total order everywhere (SyncOrder): newer wins; ties broken by origin machine id then the
        // global change id, so every node reaches the SAME verdict. A genuinely older change from a
        // concurrent exchange now correctly loses to the newer one already on the hub.
        return SyncOrder.incomingWins(incoming, local);
    }

    /**
     * Apply a single field change to an entity.
     *
     * @param entity The entity to apply the change to
     * @param change The field change to apply
     * @param failedManyToOneRefs Optional list to collect failed ManyToOne references for retry.
     *                            Pass null to skip collection (e.g., during retry pass).
     * @param idRemapTable In-batch ID remap table for dedup redirects.
     * @return true if the change was applied successfully
     */
    private boolean applyFieldChange(BaseIdEntity entity, FieldChange change,
                                     List<FailedManyToOneReference> failedManyToOneRefs,
                                     Map<String, Map<Long, Long>> idRemapTable) {
        try {
            Field field = findField(entity.getClass(), change.getFieldName());
            if (field == null) {
                // A field the local schema doesn't have (renamed/removed, or a newer peer's field) will
                // NEVER apply — retrying is pointless. This was a bare log.warn: the change is acked and
                // gone, with no record anywhere. Dead-letter it so it is visible and replayable.
                log.warn("Field not found: {}.{}", entity.getClass().getSimpleName(), change.getFieldName());
                note(change, ChangeDisposition.DEAD_LETTER);
                syncDeadLetterService.recordUnknownField(change);
                return false;
            }

            // Handle OneToMany relationships
            if ("OneToMany".equals(change.getRelationshipType())) {
                // Check if this is a unidirectional @OneToMany with @JoinColumn (no mappedBy).
                // These need direct FK updates because the child entity has no @ManyToOne back-reference.
                jakarta.persistence.JoinColumn joinCol = field.getAnnotation(jakarta.persistence.JoinColumn.class);
                jakarta.persistence.OneToMany otm = field.getAnnotation(jakarta.persistence.OneToMany.class);
                if (joinCol != null && otm != null && (otm.mappedBy() == null || otm.mappedBy().isEmpty())) {
                    return applyUnidirectionalOneToManyChange(entity, field, change, joinCol, idRemapTable);
                }
                // Bidirectional (has mappedBy) — managed by child entity's ManyToOne field
                log.debug("Skipping bidirectional OneToMany field {}.{} - managed by child entity",
                    entity.getClass().getSimpleName(), change.getFieldName());
                // Intentionally nothing to do: the child's ManyToOne carries this relationship, so the
                // state is already correct. Resolved, not pending — safe to ack.
                note(change, ChangeDisposition.NOOP_SUPERSEDED);
                return false;
            }

            // Handle ManyToMany relationships via direct join table manipulation.
            // We cannot use JPA collections because cascade behavior causes issues when
            // referenced entities exist but aren't in the current persistence context.
            if ("ManyToMany".equals(change.getRelationshipType())) {
                return applyManyToManyChange(entity, field, change, idRemapTable);
            }

            field.setAccessible(true);

            // For ManyToOne relationships, check if referenced entity exists
            if ("ManyToOne".equals(change.getRelationshipType()) && change.getNewValue() != null
                    && !"null".equals(change.getNewValue())) {
                String cleanedJson = change.getNewValue().replace("\"", "").trim();
                if (!cleanedJson.isEmpty()) {
                    try {
                        Long referencedId = Long.parseLong(cleanedJson);

                        // Check remap table — the referenced entity may have been deduplicated
                        String refType = field.getType().getSimpleName();
                        referencedId = DedupKeyResolver.resolveRemappedId(refType, referencedId, idRemapTable);

                        Object referencedEntity = entityManager.find(field.getType(), referencedId);

                        if (referencedEntity != null) {
                            field.set(entity, referencedEntity);
                            return true;
                        } else {
                            // Referenced entity not found - collect for retry if list provided
                            if (failedManyToOneRefs != null) {
                                failedManyToOneRefs.add(new FailedManyToOneReference(entity, change, field, referencedId));
                                log.debug("ManyToOne reference {}#{} not found yet - queued for retry",
                                    refType, referencedId);
                            } else {
                                log.debug("Related entity {}#{} not found - will resolve in next sync",
                                    refType, referencedId);
                            }
                            return false;
                        }
                    } catch (NumberFormatException e) {
                        log.warn("Could not parse relationship ID from '{}' for type {}",
                            change.getNewValue(), field.getType().getSimpleName());
                        // Unparseable FK id — re-sending the same bytes fails identically, so this is
                        // permanent. Record it (was an unnoted false) so the ledger stays total.
                        note(change, ChangeDisposition.DEAD_LETTER);
                        return false;
                    }
                }
            }

            Object value = deserializeValue(change.getNewValue(), field.getType(), change.getRelationshipType(), idRemapTable);

            // Remap polymorphic association IDs (entityId on EmailCorrespondence/Comment).
            // These are plain Long fields (not @ManyToOne) so dedup remap doesn't apply automatically.
            if ("entityId".equals(change.getFieldName()) && value instanceof Long rawId) {
                Field entityTypeField = findField(entity.getClass(), "entityType");
                if (entityTypeField != null) {
                    entityTypeField.setAccessible(true);
                    String refType = (String) entityTypeField.get(entity);
                    if (refType != null) {
                        Long remapped = DedupKeyResolver.resolveRemappedId(refType, rawId, idRemapTable);
                        if (!remapped.equals(rawId)) {
                            log.debug("Remapped polymorphic entityId {}#{} -> #{}", refType, rawId, remapped);
                            value = remapped;
                        }
                    }
                }
            }

            // Remap the informational-binder FKs into PhysicalObject (plain-Long soft FKs, not @ManyToOne, matching
            // the FileObject soft-FK convention). PhysicalObject IS a dedup candidate (maximoKey), so a dedup on the
            // referenced node must be honored here or the link dangles. Extend the entity set as more bindings are added.
            String bindingEntityType = entity.getClass().getSimpleName();
            if (value instanceof Long rawFk
                    && "physicalObjectId".equals(change.getFieldName())
                    && ("FileObject".equals(bindingEntityType) || "WorkArea".equals(bindingEntityType)
                        || "LotoPoint".equals(bindingEntityType))) {
                Long remapped = DedupKeyResolver.resolveRemappedId("PhysicalObject", rawFk, idRemapTable);
                if (!remapped.equals(rawFk)) {
                    log.debug("Remapped {}.physicalObjectId {} -> {}", bindingEntityType, rawFk, remapped);
                    value = remapped;
                }
            }

            // Only set if deserialization succeeded (null is valid for clearing)
            if (change.getNewValue() == null || value != null || "null".equals(change.getNewValue())) {
                field.set(entity, value);
                return true;
            }

            // The payload wouldn't deserialize into this field's type — re-sending the same bytes will
            // fail identically, so this is permanent, not pending.
            note(change, ChangeDisposition.DEAD_LETTER);
            return false;
        } catch (Exception e) {
            log.error("Error applying field change {}: {}", change.getFieldName(), e.getMessage());
            // Unknown failure — may be transient (locking, constraint, session state). Retryable.
            note(change, ChangeDisposition.FAILED_RETRYABLE);
            return false;
        }
    }

    /**
     * Apply a ManyToMany relationship change by directly manipulating the join table.
     * This avoids cascade issues that occur when using JPA collections.
     *
     * IMPORTANT: Before inserting into the join table, we verify that each referenced
     * entity actually exists in the target table. This prevents FK constraint violations
     * when SSE broadcasts split entities across multiple batches - the ManyToMany pass
     * might reference entities that haven't been received yet. Without this check,
     * FK violations mark the Hibernate transaction as rollback-only, which causes
     * ALL entities in the batch to be lost (not just the failed ManyToMany insert).
     *
     * @param entity the entity being updated
     * @param field the ManyToMany field
     * @param change the field change containing the new value (list of IDs)
     * @return true if applied successfully
     */
    private boolean applyManyToManyChange(BaseIdEntity entity, Field field, FieldChange change,
                                          Map<String, Map<Long, Long>> idRemapTable) {
        try {
            // Get the @JoinTable annotation to find the join table name and column names
            jakarta.persistence.JoinTable joinTable = field.getAnnotation(jakarta.persistence.JoinTable.class);
            if (joinTable == null) {
                // This is the inverse side (mappedBy), skip it - owning side will handle
                log.debug("Skipping ManyToMany inverse side {}.{}",
                    entity.getClass().getSimpleName(), change.getFieldName());
                // NOT deferred: the owning side's change carries the join-table rows, so there is
                // nothing here to retry — skipping IS the correct final outcome. Classifying this as
                // DEFERRED would make the receiver re-pull it forever and eventually dead-letter a
                // perfectly healthy change. Same reasoning as the bidirectional OneToMany skip above.
                note(change, ChangeDisposition.NOOP_SUPERSEDED);
                return false;
            }

            String tableName = joinTable.name();
            String ownerColumn = joinTable.joinColumns()[0].name();
            String inverseColumn = joinTable.inverseJoinColumns()[0].name();

            Long ownerId = entity.getId();

            // Resolve target entity type for remap table lookups
            Class<?> targetType = resolveCollectionElementType(field);
            String targetTypeName = targetType != null ? targetType.getSimpleName() : null;

            // Parse the new value - should be a JSON array of IDs like [123, 456]
            String json = change.getNewValue();
            List<Long> newIds = new ArrayList<>();

            if (json != null && !json.isEmpty() && !"null".equals(json) && !"[]".equals(json)) {
                // Parse JSON array of IDs
                json = json.trim();
                if (json.startsWith("[") && json.endsWith("]")) {
                    json = json.substring(1, json.length() - 1);
                    if (!json.isEmpty()) {
                        for (String idStr : json.split(",")) {
                            idStr = idStr.trim().replace("\"", "");
                            if (!idStr.isEmpty()) {
                                Long parsedId = Long.parseLong(idStr);
                                // Remap ID if the referenced entity was deduplicated
                                if (targetTypeName != null) {
                                    parsedId = DedupKeyResolver.resolveRemappedId(targetTypeName, parsedId, idRemapTable);
                                }
                                newIds.add(parsedId);
                            }
                        }
                    }
                }
            }

            // OR-Set path (flag-gated): apply as a per-element LWW-Element-Set so concurrent membership
            // edits converge instead of the whole-set winner clobbering the other. See
            // project/features/sync-and-backup/m2m-membership-convergence.md.
            if (membershipOrsetEnabled) {
                MembershipCrdtService.OrderKey key = new MembershipCrdtService.OrderKey(
                        change.getTimestamp(), change.getOriginMachineId(), change.getId());
                String ownerType = change.getEntityType();
                if (change.getOldValue() != null) {
                    // Real edit: apply the commuting delta (added=new-old, removed=old-new).
                    List<Long> oldIds = parseRemappedIds(change.getOldValue(), targetTypeName, idRemapTable);
                    Set<Long> newSet = new LinkedHashSet<>(newIds);
                    Set<Long> oldSet = new LinkedHashSet<>(oldIds);
                    List<Long> added = new ArrayList<>(newSet); added.removeAll(oldSet);
                    List<Long> removed = new ArrayList<>(oldSet); removed.removeAll(newSet);
                    // FK safety: only ADD elements that exist locally; a missing added target defers the
                    // whole change so a retry applies it once the referenced row arrives. (REMOVEs are safe.)
                    List<Long> addedExisting = filterExistingIds(field, added);
                    if (addedExisting.size() < added.size()) {
                        log.warn("ManyToMany(OR-Set) {}.{}: {} added target(s) not present yet — deferring",
                                entity.getClass().getSimpleName(), change.getFieldName(), added.size() - addedExisting.size());
                        note(change, ChangeDisposition.DEFERRED);
                        return false;
                    }
                    membershipCrdtService.applyDelta(ownerType, ownerId, change.getFieldName(),
                            tableName, ownerColumn, inverseColumn, addedExisting, removed, key);
                    log.debug("Applied ManyToMany(OR-Set) {}.{}: +{} -{}",
                            entity.getClass().getSimpleName(), change.getFieldName(), addedExisting.size(), removed.size());
                } else {
                    // Whole-set reconcile directive (drift "Use Hub" / accept-remote): set exactly newIds,
                    // via a delivery-INDEPENDENT RESET barrier at this change's key (see applyReconcile).
                    List<Long> targets = new ArrayList<>(new LinkedHashSet<>(newIds));
                    List<Long> targetsExisting = filterExistingIds(field, targets);
                    if (targetsExisting.size() < targets.size()) {
                        log.warn("ManyToMany(OR-Set reconcile) {}.{}: {} target(s) not present yet — deferring",
                                entity.getClass().getSimpleName(), change.getFieldName(), targets.size() - targetsExisting.size());
                        note(change, ChangeDisposition.DEFERRED);
                        return false;
                    }
                    membershipCrdtService.applyReconcile(ownerType, ownerId, change.getFieldName(),
                            tableName, ownerColumn, inverseColumn, targetsExisting, key);
                    log.debug("Applied ManyToMany(OR-Set reconcile) {}.{}: ={}",
                            entity.getClass().getSimpleName(), change.getFieldName(), targetsExisting.size());
                }
                return true;
            }

            // Filter newIds to only include entities that actually exist in the target table.
            // This prevents FK constraint violations when referenced entities haven't been
            // received yet (e.g., they're in the next SSE batch).
            List<Long> existingIds = filterExistingIds(field, newIds);

            if (existingIds.size() < newIds.size()) {
                log.warn("ManyToMany {}.{}: {} of {} referenced entities not found yet, skipping those",
                    entity.getClass().getSimpleName(), change.getFieldName(),
                    newIds.size() - existingIds.size(), newIds.size());
                log.debug("ManyToMany {}.{}: incomplete apply ({}/{} entities), leaving join table unchanged so retry can apply atomically",
                    entity.getClass().getSimpleName(), change.getFieldName(), existingIds.size(), newIds.size());
                // The comment above promises a retry that never comes: this returns false, the caller
                // ignores it, and the receiver acks the change anyway — so the join table stays
                // permanently incomplete (e.g. a LotoStandard that loses points the client never had).
                // This is THE case the ledger exists for.
                note(change, ChangeDisposition.DEFERRED);
                return false;
            }

            // Delete existing entries only after every requested reference is known to
            // exist. Otherwise a split sync batch can destructively replace a valid
            // relationship with a partial subset before the missing child arrives.
            entityManager.createNativeQuery(
                "DELETE FROM " + tableName + " WHERE " + ownerColumn + " = :ownerId")
                .setParameter("ownerId", ownerId)
                .executeUpdate();

            // Insert only entries that reference existing entities
            for (Long relatedId : existingIds) {
                entityManager.createNativeQuery(
                    "INSERT INTO " + tableName + " (" + ownerColumn + ", " + inverseColumn + ") VALUES (:ownerId, :relatedId)")
                    .setParameter("ownerId", ownerId)
                    .setParameter("relatedId", relatedId)
                    .executeUpdate();
            }

            log.debug("Applied ManyToMany {}.{}: {} entries in join table {} ({} requested)",
                entity.getClass().getSimpleName(), change.getFieldName(),
                existingIds.size(), tableName, newIds.size());

            return true;

        } catch (Exception e) {
            log.error("Error applying ManyToMany change {}.{}: {}",
                entity.getClass().getSimpleName(), change.getFieldName(), e.getMessage());
            // An exception is a transient failure, not a missing reference — FAILED_RETRYABLE per
            // ChangeDisposition's own definitions. Both are non-terminal (never acked), so this is
            // equivalent for acknowledgement but stays honest for the hub's durable retry later.
            note(change, ChangeDisposition.FAILED_RETRYABLE);
            return false;
        }
    }

    /** Parse a serialized id list ("[123, 456]") into remapped Long ids. null/empty/"[]" → empty. */
    private List<Long> parseRemappedIds(String json, String targetTypeName,
                                        Map<String, Map<Long, Long>> idRemapTable) {
        List<Long> ids = new ArrayList<>();
        if (json == null || json.isEmpty() || "null".equals(json) || "[]".equals(json)) return ids;
        json = json.trim();
        if (json.startsWith("[") && json.endsWith("]")) {
            json = json.substring(1, json.length() - 1);
            if (!json.isEmpty()) {
                for (String idStr : json.split(",")) {
                    idStr = idStr.trim().replace("\"", "");
                    if (!idStr.isEmpty()) {
                        Long parsedId = Long.parseLong(idStr);
                        if (targetTypeName != null) {
                            parsedId = DedupKeyResolver.resolveRemappedId(targetTypeName, parsedId, idRemapTable);
                        }
                        ids.add(parsedId);
                    }
                }
            }
        }
        return ids;
    }

    /**
     * Handle unidirectional @OneToMany with @JoinColumn — sets the FK column on child rows via SQL.
     * This is needed because the child entity has no @ManyToOne back-reference, so field-level
     * sync can't set the FK from the child side.
     *
     * Returns false if any referenced child doesn't exist yet — the change will NOT be saved
     * as received, allowing the next sync to retry once the children are created.
     */
    private boolean applyUnidirectionalOneToManyChange(BaseIdEntity entity, Field field, FieldChange change,
                                                        jakarta.persistence.JoinColumn joinCol,
                                                        Map<String, Map<Long, Long>> idRemapTable) {
        try {
            String fkColumn = joinCol.name();
            Long parentId = entity.getId();

            // Resolve child entity type and table name
            Class<?> childType = resolveCollectionElementType(field);
            if (childType == null) {
                log.warn("Cannot resolve element type for OneToMany field {}.{}",
                    entity.getClass().getSimpleName(), change.getFieldName());
                return false;
            }
            String childTable = entityTableRegistry.getTableName(childType.getSimpleName());

            // Parse the new value — JSON array of child IDs like [101, 102]
            String json = change.getNewValue();
            List<Long> childIds = new ArrayList<>();

            if (json != null && !json.isEmpty() && !"null".equals(json) && !"[]".equals(json)) {
                json = json.trim();
                if (json.startsWith("[") && json.endsWith("]")) {
                    json = json.substring(1, json.length() - 1);
                    if (!json.isEmpty()) {
                        for (String idStr : json.split(",")) {
                            idStr = idStr.trim().replace("\"", "");
                            if (!idStr.isEmpty()) {
                                Long parsedId = Long.parseLong(idStr);
                                parsedId = DedupKeyResolver.resolveRemappedId(childType.getSimpleName(), parsedId, idRemapTable);
                                childIds.add(parsedId);
                            }
                        }
                    }
                }
            }

            // Check that ALL referenced children exist before applying
            List<Long> existingIds = filterExistingIds(field, childIds);
            log.debug("OneToMany {}.{}: childIds={}, existingIds={}, childTable={}, fkColumn={}",
                entity.getClass().getSimpleName(), change.getFieldName(),
                childIds, existingIds, childTable, fkColumn);
            if (existingIds.size() < childIds.size()) {
                log.info("OneToMany {}.{}: {}/{} child entities not found yet — deferring to next sync",
                    entity.getClass().getSimpleName(), change.getFieldName(),
                    childIds.size() - existingIds.size(), childIds.size());
                return false; // Don't save change — retry on next sync
            }

            // Aggregate membership collections are not safe to apply destructively via generic
            // last-writer-wins sync. A stale or partial payload can otherwise detach packages
            // from jobs or permits from packages and orphan/remove data on the hub.
            boolean additiveOnly = isProtectedAggregateMembershipField(entity.getClass(), change.getFieldName());
            if (!additiveOnly) {
                entityManager.createNativeQuery(
                    "UPDATE " + childTable + " SET " + fkColumn + " = NULL WHERE " + fkColumn + " = :parentId")
                    .setParameter("parentId", parentId)
                    .executeUpdate();
            } else {
                log.warn("Applying additive-only OneToMany sync for protected aggregate field {}.{}",
                    entity.getClass().getSimpleName(), change.getFieldName());
            }

            // Set FK on current children and verify each UPDATE affected a row
            int totalAffected = 0;
            for (Long childId : childIds) {
                int affected = entityManager.createNativeQuery(
                    "UPDATE " + childTable + " SET " + fkColumn + " = :parentId WHERE id = :childId")
                    .setParameter("parentId", parentId)
                    .setParameter("childId", childId)
                    .executeUpdate();
                totalAffected += affected;
            }

            if (totalAffected < childIds.size()) {
                log.warn("OneToMany {}.{}: UPDATE affected {}/{} rows — some FK links may be missing",
                    entity.getClass().getSimpleName(), change.getFieldName(),
                    totalAffected, childIds.size());
                return false; // Incomplete — don't save, retry next sync
            }

            log.debug("Applied OneToMany {}.{}: set {}={} on {} child rows in {}",
                entity.getClass().getSimpleName(), change.getFieldName(),
                fkColumn, parentId, childIds.size(), childTable);
            return true;

        } catch (Exception e) {
            log.error("Error applying OneToMany {}.{}: {}",
                entity.getClass().getSimpleName(), change.getFieldName(), e.getMessage());
            return false;
        }
    }

    private boolean isProtectedAggregateMembershipField(Class<?> entityClass, String fieldName) {
        String entityName = entityClass.getSimpleName();
        if ("JobLog".equals(entityName) && "packages".equals(fieldName)) {
            return true;
        }
        // A printable form's containers are grow-only per child: the additive path only ever sets
        // a child's FK, never clears one (removal rides the container's own DELETE). Without this
        // guard a stale or partial payload NULLs every container's printable_form_id before
        // re-pointing, so a peer's concurrently-added container is silently detached.
        if ("PrintableForm".equals(entityName) && "formContainers".equals(fieldName)) {
            return true;
        }
        if ("DailyPermitPackage".equals(entityName)) {
            return Set.of(
                "workRequests",
                "safeWorks",
                "hotWorks",
                "confinedSpaces",
                "lotos",
                "energizedWorkPermits",
                "excavationPermits",
                "ventingPermits"
            ).contains(fieldName);
        }
        return false;
    }

    /**
     * Filter a list of entity IDs to only include those that exist in the target table.
     * Uses the field's generic type parameter to determine the target entity type,
     * then queries the target table to check existence.
     *
     * @param field the ManyToMany collection field (e.g., Set<FileObject>)
     * @param ids the IDs to check
     * @return list of IDs that exist in the target table
     */
    @SuppressWarnings("unchecked")
    private List<Long> filterExistingIds(Field field, List<Long> ids) {
        if (ids.isEmpty()) {
            return ids;
        }

        // Resolve target entity type from collection's generic type parameter
        Class<?> targetType = resolveCollectionElementType(field);
        if (targetType == null) {
            log.warn("Could not resolve target type for ManyToMany field {}, inserting without existence check",
                field.getName());
            return ids;
        }

        String targetTable = entityTableRegistry.getTableName(targetType.getSimpleName());
        if (targetTable == null) {
            log.warn("No table mapping for {}, inserting without existence check", targetType.getSimpleName());
            return ids;
        }

        // Batch query to find which IDs exist
        List<?> foundRows = entityManager.createNativeQuery(
            "SELECT id FROM " + targetTable + " WHERE id IN :ids")
            .setParameter("ids", ids)
            .getResultList();

        Set<Long> foundIds = foundRows.stream()
            .map(o -> ((Number) o).longValue())
            .collect(Collectors.toSet());

        return ids.stream()
            .filter(foundIds::contains)
            .collect(Collectors.toList());
    }

    /**
     * Resolve the element type of a collection field's generic type parameter.
     * For example, Set<FileObject> returns FileObject.class.
     */
    private Class<?> resolveCollectionElementType(Field field) {
        java.lang.reflect.Type genericType = field.getGenericType();
        if (genericType instanceof java.lang.reflect.ParameterizedType) {
            java.lang.reflect.ParameterizedType pt = (java.lang.reflect.ParameterizedType) genericType;
            java.lang.reflect.Type[] typeArgs = pt.getActualTypeArguments();
            if (typeArgs.length > 0 && typeArgs[0] instanceof Class) {
                return (Class<?>) typeArgs[0];
            }
        }
        return null;
    }


    /**
     * Save an incoming change to our log (mark as synced to us and to server)
     */
    private void saveIncomingChange(FieldChange change) {
        if (change == null) return;
        // Hub already saved FieldChanges in processIncomingChangesBatched — skip to avoid duplicates
        if (skipSaveFieldChanges) return;

        // Identity IS the dedup key now: a change carries one global id for its whole life, so
        // re-delivery is a plain existsById check. This replaces the old 5-tuple pre-check
        // (entityType+entityId+fieldName+timestamp+originMachineId), which was a proxy for the same
        // thing. A null id means a legacy/local change with no global identity — fall back to the tuple
        // check so those still dedup correctly.
        UUID originId = change.getId();
        boolean exists = originId != null
            ? fieldChangeRepository.existsById(originId)
            : fieldChangeRepository.existsByEntityTypeAndEntityIdAndFieldNameAndTimestampAndOriginMachineId(
                change.getEntityType(), change.getEntityId(), change.getFieldName(),
                change.getTimestamp(), change.getOriginMachineId());

        if (!exists) {
            // Create a NEW entity to avoid Hibernate persistence context conflicts.
            // The incoming 'change' may be a managed entity (e.g., when called from
            // HubSyncService.syncExchange with already-saved changes), and mutating it directly
            // causes "identifier was altered" errors at flush time.
            FieldChange newChange = new FieldChange();
            // Preserve the ORIGIN's id so this row is the same logical change everywhere — the basis of
            // idempotent re-delivery and of using the change id as the conflict tiebreak. The custom
            // id generator keeps a pre-set id (Hibernate's default UUID strategy would re-mint it).
            newChange.setId(originId);
            newChange.setEntityType(change.getEntityType());
            newChange.setEntityId(change.getEntityId());
            newChange.setFieldName(change.getFieldName());
            newChange.setOldValue(change.getOldValue());
            newChange.setNewValue(change.getNewValue());
            newChange.setTimestamp(change.getTimestamp());
            newChange.setOriginMachineId(change.getOriginMachineId());
            newChange.setOriginMachineName(change.getOriginMachineName());
            newChange.setChangeType(change.getChangeType());
            newChange.setRelationshipType(change.getRelationshipType());
            newChange.setReceivedAt(Instant.now());
            newChange.addSyncedMachine(syncConfig.getMachineId());
            // Also mark as synced to SERVER since this change came FROM the server
            // This prevents the change from being sent back to the server in the next periodic sync
            newChange.addSyncedMachine("SERVER");
            fieldChangeRepository.save(newChange);
        }
    }

    /**
     * Load all persistent dedup remaps into an in-memory map.
     * Called at the start of each applyIncomingChangesInternal() so that
     * cross-batch ManyToOne references to dedup-redirected IDs resolve correctly.
     */
    @SuppressWarnings("unchecked")
    private Map<String, Map<Long, Long>> loadPersistentRemaps() {
        Map<String, Map<Long, Long>> table = new HashMap<>();
        try {
            List<Object[]> rows = entityManager.createNativeQuery(
                "SELECT entity_type, original_id, remapped_id FROM dedup_id_remap")
                .getResultList();
            for (Object[] row : rows) {
                String type = (String) row[0];
                Long origId = ((Number) row[1]).longValue();
                Long remapId = ((Number) row[2]).longValue();
                table.computeIfAbsent(type, k -> new HashMap<>()).put(origId, remapId);
            }
            if (!table.isEmpty()) {
                int total = table.values().stream().mapToInt(Map::size).sum();
                log.debug("Loaded {} persistent dedup remaps", total);
            }
        } catch (Exception e) {
            log.warn("Could not load persistent dedup remaps: {}", e.getMessage());
        }
        return table;
    }

    /**
     * Persist a new dedup remap so future batches can resolve it.
     * Uses native SQL MERGE INTO (H2 upsert) instead of JPA save() to avoid
     * poisoning the Hibernate session on unique constraint violations.
     * JPA save() adds the entity to the persistence context BEFORE the INSERT;
     * if the INSERT fails, the dirty entity stays in the context and any
     * subsequent auto-flush triggers "null id in DedupIdRemap entry", rolling
     * back the entire sync batch.
     */
    private void persistDedupRemap(String entityType, Long originalId, Long remappedId) {
        try {
            entityManager.createNativeQuery(
                "MERGE INTO dedup_id_remap (entity_type, original_id, remapped_id, created_at) " +
                "KEY (entity_type, original_id) " +
                "VALUES (:entityType, :originalId, :remappedId, :createdAt)")
                .setParameter("entityType", entityType)
                .setParameter("originalId", originalId)
                .setParameter("remappedId", remappedId)
                .setParameter("createdAt", Instant.now())
                .executeUpdate();
        } catch (Exception e) {
            log.warn("Could not persist dedup remap: {}#{} -> #{}: {}",
                entityType, originalId, remappedId, e.getMessage());
        }
    }

    /**
     * Deserialize a value from JSON string.
     *
     * IMPORTANT: For relationship references, this method uses EntityManager.find() directly
     * instead of the repository's findById(). This bypasses the @Where(clause = "deleted = false")
     * filter that would otherwise prevent finding soft-deleted entities.
     *
     * This is critical for sync because:
     * 1. When an entity (e.g., Vendor) is deleted, its 'deleted' flag is set to true
     * 2. Other entities (e.g., FileObject) may still reference the deleted Vendor
     * 3. When syncing, we need to preserve these references even to deleted entities
     * 4. Using repository.findById() would return null for deleted entities, breaking the relationship
     */
    @SuppressWarnings("unchecked")
    private Object deserializeValue(String json, Class<?> targetType, String relationshipType,
                                    Map<String, Map<Long, Long>> idRemapTable) {
        if (json == null || "null".equals(json)) return null;

        try {
            // Handle relationship references - fetch referenced entity by ID
            if (relationshipType != null && BaseIdEntity.class.isAssignableFrom(targetType)) {
                // Parse entity ID from JSON and load the referenced entity
                String cleanedJson = json.replace("\"", "").trim();
                if (cleanedJson.isEmpty() || "null".equals(cleanedJson)) {
                    return null; // Relationship cleared
                }

                try {
                    Long relatedId = Long.parseLong(cleanedJson);

                    // Check remap table — the referenced entity may have been deduplicated
                    relatedId = DedupKeyResolver.resolveRemappedId(targetType.getSimpleName(), relatedId, idRemapTable);

                    // Use find() to get the actual entity from the database.
                    // We cannot use getReference() because it may return a proxy that hasn't been
                    // properly associated with the current persistence context, causing cascade issues.
                    Object relatedEntity = entityManager.find(targetType, relatedId);

                    if (relatedEntity != null) {
                        // Validate that we got an actual entity, not just the ID
                        if (relatedEntity instanceof BaseIdEntity) {
                            log.debug("Resolved relationship {} -> entity #{} (using EntityManager.find)",
                                targetType.getSimpleName(), relatedId);
                            return relatedEntity;
                        } else {
                            log.error("EntityManager.find returned non-entity for {}#{}: {}",
                                targetType.getSimpleName(), relatedId, relatedEntity.getClass().getName());
                            return null;
                        }
                    } else {
                        // Entity not found - this can happen if the referenced entity hasn't been
                        // synced yet (ordering issue). Skip this field for now.
                        log.warn("Related entity {}#{} not found - may not be synced yet",
                            targetType.getSimpleName(), relatedId);
                        return null;
                    }
                } catch (NumberFormatException e) {
                    log.warn("Could not parse relationship ID from '{}' for type {}", json, targetType.getSimpleName());
                    return null;
                }
            }

            // Handle primitives and wrappers
            if (targetType == String.class) {
                // Remove surrounding quotes if present (from old-format FieldChanges
                // where serializeValue used writeValueAsString on strings).
                // Use Jackson to properly unescape JSON escape sequences (e.g., \" → ")
                // so that JSON LOB fields like positionJson are restored correctly.
                if (json.startsWith("\"") && json.endsWith("\"")) {
                    try {
                        return objectMapper.readValue(json, String.class);
                    } catch (Exception e) {
                        // Fallback: strip quotes manually
                        return json.substring(1, json.length() - 1);
                    }
                }
                return json;
            }
            if (targetType == Long.class || targetType == long.class) {
                return Long.parseLong(json.replace("\"", ""));
            }
            if (targetType == Integer.class || targetType == int.class) {
                return Integer.parseInt(json.replace("\"", ""));
            }
            if (targetType == Double.class || targetType == double.class) {
                return Double.parseDouble(json.replace("\"", ""));
            }
            if (targetType == Boolean.class || targetType == boolean.class) {
                return Boolean.parseBoolean(json.replace("\"", ""));
            }

            // Handle enums
            if (targetType.isEnum()) {
                String enumValue = json.replace("\"", "");
                return Enum.valueOf((Class<Enum>) targetType, enumValue);
            }

            // Handle complex types via Jackson
            return objectMapper.readValue(json, targetType);

        } catch (Exception e) {
            log.warn("Error deserializing value '{}' to type {}: {}",
                truncate(json), targetType.getSimpleName(), e.getMessage());
            return null;
        }
    }

    /**
     * Find a field by name, including inherited fields
     */
    private Field findField(Class<?> clazz, String fieldName) {
        while (clazz != null && clazz != Object.class) {
            try {
                return clazz.getDeclaredField(fieldName);
            } catch (NoSuchFieldException e) {
                clazz = clazz.getSuperclass();
            }
        }
        return null;
    }

    /**
     * Get the database table name for an entity type.
     * Delegates to EntityTableRegistry for centralized mapping.
     */
    private String getTableName(String entityType) {
        return entityTableRegistry.getTableName(entityType);
    }

    /**
     * Get total change count
     */
    public long getTotalChangeCount() {
        return fieldChangeRepository.count();
    }

    /**
     * Cleanup old changes based on retention policy.
     * Hub has its own cleanup in HubSyncService (3 AM) with hub-specific retention.
     */
    @Scheduled(cron = "0 0 2 * * ?") // Run at 2 AM daily
    @Transactional
    public void cleanupOldChanges() {
        if (syncConfig.isHubMode()) return; // Hub uses HubSyncService.cleanupOldChanges()
        Instant cutoff = Instant.now().minusSeconds(syncConfig.getRetentionDays() * 24L * 60 * 60);
        int deleted = fieldChangeRepository.deleteChangesBefore(cutoff);
        if (deleted > 0) {
            log.info("peer_sync.cleanup.complete deletedChanges={} retentionDays={}",
                deleted, syncConfig.getRetentionDays());
        }
    }

    private String truncate(String s) {
        if (s == null) return "null";
        return s.length() > 50 ? s.substring(0, 47) + "..." : s;
    }

    /**
     * Advance the shared id_seq sequence if a synced entity's ID falls in the local device's range.
     *
     * Sync creates entities with pre-set IDs (bypassing DevicePrefixedIdGenerator), so the
     * sequence is never incremented. If a synced entity uses an ID in OUR device's range
     * (e.g., from a cold-resync restore or hub migration), future local inserts will generate
     * the same ID → PK violation. This method ensures the sequence stays ahead.
     */
    private void advanceSequencePastIfNeeded(Long entityId) {
        if (entityId == null) return;
        int deviceNumber = syncConfig.getDeviceNumber();
        if (deviceNumber < 0 || deviceNumber > 99) return;

        long multiplier = 1_000_000_000L;
        long rangeStart = (long) deviceNumber * multiplier;
        long rangeEnd = rangeStart + multiplier;

        if (entityId < rangeStart || entityId >= rangeEnd) return; // Not our range

        long suffix = entityId % multiplier;
        try {
            // NEXT VALUE consumes one value — unavoidable in H2 (no CURRENT VALUE syntax)
            Long currentSeq = ((Number) entityManager.createNativeQuery(
                "SELECT NEXT VALUE FOR id_seq").getSingleResult()).longValue();
            if (currentSeq <= suffix) {
                long newStart = suffix + 1;
                entityManager.createNativeQuery(
                    "ALTER SEQUENCE id_seq RESTART WITH " + newStart).executeUpdate();
                log.warn("Advanced id_seq: {} -> {} (synced entity ID {} is in device {} range)",
                    currentSeq, newStart, entityId, deviceNumber);
            }
        } catch (Exception e) {
            log.warn("Failed to advance id_seq after syncing entity ID {}: {}", entityId, e.getMessage());
        }
    }

    /**
     * Tracks a ManyToOne field change that failed because the referenced entity wasn't found.
     * Used for retry in the third pass after all entities are created.
     */
    private static class FailedManyToOneReference {
        final BaseIdEntity entity;
        final FieldChange change;
        final Field field;
        final Long referencedId;

        FailedManyToOneReference(BaseIdEntity entity, FieldChange change, Field field, Long referencedId) {
            this.entity = entity;
            this.change = change;
            this.field = field;
            this.referencedId = referencedId;
        }
    }

    /**
     * Emit a sync activity event to the frontend SSE feed.
     * Determines the changeType from the first change in the list.
     */
    private void emitActivityEvent(String direction, String entityType, Long entityId,
                                    List<FieldChange> changes, String status) {
        try {
            String changeType = "UPDATE";
            if (changes != null && !changes.isEmpty()) {
                FieldChange first = changes.get(0);
                if (first.getChangeType() != null) {
                    changeType = first.getChangeType().name();
                }
            }
            syncUpdateController.broadcastSyncActivity(
                SyncUpdateController.SyncActivityEvent.builder()
                    .direction(direction)
                    .entityType(entityType)
                    .entityId(String.valueOf(entityId))
                    .changeType(changeType)
                    .status(status)
                    .timestamp(System.currentTimeMillis())
                    .build()
            );
        } catch (Exception e) {
            log.trace("Failed to emit sync activity event: {}", e.getMessage());
        }
    }
}
