package com.dk_power.power_plant_java.sevice.angular.file;

import com.dk_power.power_plant_java.dto.files.ConnectorMigrationItemDto;
import com.dk_power.power_plant_java.dto.files.ConnectorMigrationReportDto;
import com.dk_power.power_plant_java.dto.files.FileConnectorDto;
import com.dk_power.power_plant_java.dto.files.FileConnectorIdDto;
import com.dk_power.power_plant_java.dto.files.LegacyConnectorContextDto;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.files.FileConnector;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.mappers.FileConnectorMapper;
import com.dk_power.power_plant_java.repository.equipment.EquipmentRepo;
import com.dk_power.power_plant_java.repository.file.FileConnectorRepo;
import com.dk_power.power_plant_java.repository.file.FileRepo;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import com.dk_power.power_plant_java.sevice.sync.FieldChangeTracker;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * Service for {@link FileConnector} — off-page reference shapes on P&IDs.
 *
 * <p>Counterpart pairing is enforced HERE (not on the entity or via direct
 * DTO patching) so the bidirectional invariants stay consistent:
 * <ul>
 *   <li>No self-link.</li>
 *   <li>{@link #linkCounterparts} updates BOTH sides atomically via saveAndFlush.</li>
 *   <li>{@link #unlinkCounterpart} clears the opposite side too — never leave
 *       a dangling counterpartConnectorId pointing at a connector whose
 *       counterpartConnectorId points elsewhere or null.</li>
 *   <li>{@link #softDelete} clears the surviving counterpart's pointer so it
 *       doesn't reference a soft-deleted row.</li>
 * </ul>
 *
 * <p>These mirror the same patterns we use for {@code LotoPoint.counterpartId}
 * and {@code FileObject.counterpartId} — one consistent counterpart model
 * across the codebase.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class NgFileConnectorService
        implements NgCrudService<FileConnector, FileConnectorDto, FileConnectorRepo, FileConnectorMapper> {
    private static final Logger log = LoggerFactory.getLogger(NgFileConnectorService.class);

    private final FileConnectorRepo connectorRepo;
    private final FileConnectorMapper connectorMapper;
    private final EquipmentRepo equipmentRepo;
    private final FileRepo fileRepo;
    private final ConnectorMigrationItemRunner itemRunner;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;
    private final FieldChangeTracker fieldChangeTracker;

    // ------------------------------------------------------------------------
    // NgCrudService accessor overrides — wires this service into the sync
    // infrastructure (ServiceFacade.getService("FileConnector") and friends).
    // Without these, outbound FileChangeListener emissions would have no
    // service to apply incoming changes on the receiving side.
    // ------------------------------------------------------------------------
    @Override public FileConnectorRepo getRepo() { return connectorRepo; }
    @Override public FileConnectorMapper getMapper() { return connectorMapper; }
    @Override public SessionFactory getSessionFactory() { return sessionFactory; }
    @Override public FileConnectorDto getDto() { return new FileConnectorDto(); }
    @Override public FileConnector getEntity() { return new FileConnector(); }
    @Override public EntityManager getEntityManager() { return entityManager; }
    @Override public Class<FileConnector> getEntityClass() { return FileConnector.class; }

    /**
     * Minimum tagNumber length to consider a substring match "specific enough"
     * to auto-migrate. Below this, the match is too generic (e.g. "PD-03"
     * could legitimately reference dozens of files) and the row is shunted
     * to the manual-review list. Tunable per-call via the migration endpoint.
     */
    public static final int DEFAULT_MIN_TAG_LENGTH = 5;

    // ------------------------------------------------------------------------
    // CRUD
    // ------------------------------------------------------------------------

    /** All connectors drawn on a given source file — viewer renders these as shapes. */
    public List<FileConnectorDto> findBySourceFile(Long sourceFileId) {
        return connectorRepo.findBySourceFile_Id(sourceFileId).stream()
            .map(connectorMapper::convertToDto)
            .toList();
    }

    public Optional<FileConnectorDto> findDtoById(Long id) {
        return connectorRepo.findById(id).map(connectorMapper::convertToDto);
    }

    /**
     * Persist a new or updated connector. Validates that BOTH source and
     * target files are resolved (the mapper sets null when caller's id is
     * unknown — we refuse to save an orphan connector).
     *
     * <p>After the save, attempts to auto-pair: if this connector is unpaired
     * AND exactly ONE unpaired connector on the target file points back at
     * the source file, links them as bidirectional counterparts. Same 1:1
     * rule the bulk migration uses — multi-on-either-side is left for
     * manual pairing via the Link button in the info window.
     */
    public FileConnectorDto save(FileConnectorIdDto dto) {
        FileConnector entity = connectorMapper.convertIdDtoToEntity(dto);
        if (entity.getSourceFile() == null || entity.getTargetFile() == null) {
            throw new RuntimeException("FileConnector requires both sourceFile and targetFile to resolve");
        }
        FileConnector saved = connectorRepo.save(entity);
        tryAutoPair(saved);
        // Re-read after the (possible) pair update so the returned DTO carries
        // the now-set counterpartConnectorId for the caller's local state.
        FileConnector refreshed = connectorRepo.findById(saved.getId()).orElse(saved);
        return connectorMapper.convertToDto(refreshed);
    }

    /**
     * Link this connector to its 1:1 reciprocal on the target file if one
     * exists and neither side is already paired. Quiet: any other shape
     * (no reciprocal, multiple reciprocals, this side already paired) leaves
     * the row untouched — manual pairing via {@link #linkCounterparts} is
     * still available for those cases. Failure here doesn't throw (caller
     * already committed the save) — auto-pair is best-effort UX, not contract.
     */
    private void tryAutoPair(FileConnector saved) {
        try {
            if (saved.getCounterpartConnectorId() != null) return; // already paired
            if (saved.getSourceFile() == null || saved.getTargetFile() == null) return;
            Long srcId = saved.getSourceFile().getId();
            Long tgtId = saved.getTargetFile().getId();

            // Reciprocals: connectors on the target file pointing back at the
            // source file. Filter out deleted + already-paired (paired ones
            // have a known counterpart — don't poach them).
            List<FileConnector> reciprocals = connectorRepo.findBySourceAndTarget(tgtId, srcId).stream()
                .filter(c -> !c.getId().equals(saved.getId()))
                .filter(c -> c.getCounterpartConnectorId() == null)
                .toList();

            if (reciprocals.size() != 1) {
                // 0 — no peer yet; 2+ — ambiguous, user must pick manually.
                return;
            }
            FileConnector peer = reciprocals.get(0);
            saved.setCounterpartConnectorId(peer.getId());
            peer.setCounterpartConnectorId(saved.getId());
            connectorRepo.saveAndFlush(saved);
            connectorRepo.saveAndFlush(peer);
            log.info("auto-paired FileConnectors #{} ↔ #{} on save", saved.getId(), peer.getId());
        } catch (RuntimeException ex) {
            log.warn("auto-pair on save failed for FileConnector #{}: {}", saved.getId(), ex.getMessage());
        }
    }

    /**
     * Find the unpaired reciprocals for a given connector — used by the info
     * window's "Link counterpart" button. Returns connectors on the target
     * file pointing back at the source, filtered to those without a current
     * pairing. Empty list when no candidate exists; size>1 means the user
     * needs to disambiguate (frontend shows a picker).
     */
    @Transactional(readOnly = true)
    public List<FileConnectorDto> findCounterpartCandidates(Long connectorId) {
        FileConnector c = connectorRepo.findById(connectorId).orElseThrow(
            () -> new RuntimeException("FileConnector not found: " + connectorId));
        if (c.getSourceFile() == null || c.getTargetFile() == null) return List.of();
        return connectorRepo.findBySourceAndTarget(c.getTargetFile().getId(), c.getSourceFile().getId()).stream()
            .filter(other -> !other.getId().equals(connectorId))
            .filter(other -> other.getCounterpartConnectorId() == null)
            .map(connectorMapper::convertToDto)
            .toList();
    }

    /**
     * Soft-delete by id. ALSO clears the surviving counterpart's
     * counterpartConnectorId so it doesn't reference a deleted row.
     * Named distinctly from the inherited {@code NgCrudService.softDelete} so
     * the interface contract (which returns the soft-deleted entity) stays
     * honored — connector deletion needs side effects (clear peer's pointer)
     * that the generic implementation can't know about.
     */
    public void removeConnector(Long id) {
        FileConnector connector = connectorRepo.findById(id).orElse(null);
        if (connector == null) return;

        // Clear opposite side BEFORE deleting this one — same invariant as unlink.
        Long counterpartId = connector.getCounterpartConnectorId();
        if (counterpartId != null) {
            connectorRepo.findById(counterpartId).ifPresent(other -> {
                if (id.equals(other.getCounterpartConnectorId())) {
                    other.setCounterpartConnectorId(null);
                    connectorRepo.saveAndFlush(other);
                }
            });
        }

        connector.setDeleted(true);
        connector.setCounterpartConnectorId(null);
        connectorRepo.saveAndFlush(connector);
        log.info("Soft-deleted FileConnector #{} (was paired with #{})", id, counterpartId);
    }

    // ------------------------------------------------------------------------
    // Pairing — enforces the invariants listed in the class javadoc
    // ------------------------------------------------------------------------

    /**
     * Link two connectors as bidirectional counterparts. Updates BOTH sides
     * atomically with saveAndFlush so a downstream rollback can't leave them
     * inconsistent. If either side already has a counterpart pointing
     * elsewhere, that side's old pointer is overwritten (the old peer keeps
     * its now-stale pointer until it's explicitly unlinked or re-linked —
     * acceptable trade-off, matches FileObject counterpart behavior).
     */
    public void linkCounterparts(Long connectorAId, Long connectorBId) {
        if (connectorAId == null || connectorBId == null) {
            throw new RuntimeException("link-counterpart: both ids required");
        }
        if (connectorAId.equals(connectorBId)) {
            throw new RuntimeException("link-counterpart: a connector cannot be its own counterpart");
        }
        FileConnector a = connectorRepo.findById(connectorAId).orElseThrow(
            () -> new RuntimeException("FileConnector not found: " + connectorAId));
        FileConnector b = connectorRepo.findById(connectorBId).orElseThrow(
            () -> new RuntimeException("FileConnector not found: " + connectorBId));

        a.setCounterpartConnectorId(b.getId());
        b.setCounterpartConnectorId(a.getId());
        connectorRepo.saveAndFlush(a);
        connectorRepo.saveAndFlush(b);
        log.info("Linked FileConnectors #{} ↔ #{}", a.getId(), b.getId());
    }

    /**
     * Clear the counterpart pointer on this connector AND on its current peer
     * (bidirectional unlink). Only touches the peer's pointer if it actually
     * points back at us — defensive against partial-state rows from older
     * data or interrupted writes.
     */
    public void unlinkCounterpart(Long connectorId) {
        FileConnector connector = connectorRepo.findById(connectorId).orElseThrow(
            () -> new RuntimeException("FileConnector not found: " + connectorId));
        Long peerId = connector.getCounterpartConnectorId();
        connector.setCounterpartConnectorId(null);
        connectorRepo.saveAndFlush(connector);

        if (peerId != null) {
            connectorRepo.findById(peerId).ifPresent(peer -> {
                if (connectorId.equals(peer.getCounterpartConnectorId())) {
                    peer.setCounterpartConnectorId(null);
                    connectorRepo.saveAndFlush(peer);
                }
            });
        }
        log.info("Unlinked FileConnector #{} (was paired with #{})", connectorId, peerId);
    }

    // ========================================================================
    // Equipment → FileConnector migration
    // ========================================================================
    //
    // One-shot data migration for the legacy world where connectors were
    // Equipment rows with eqType.name='connector' and a tagNumber holding a
    // partial substring of the target file's fileNumber. Codex's pre-build
    // critique flagged several risks; the implementation here enforces:
    //
    //   1. Tag-length floor (default 5 chars). Below this, substring matches
    //      are unsafe — too many false positives. Short tags → manual review.
    //   2. Data-cleanliness gate. Skip any Equipment row with attached
    //      lotoPoints or files — migrating it would silently lose semantic data
    //      the operator may not realize is there.
    //   3. Idempotency. Re-running the migration with the same data must
    //      produce the same outcome. Achieved by:
    //        - JPA @Where(deleted IS NOT TRUE) on Equipment means soft-deleted
    //          rows are already excluded from the source query.
    //        - The "already migrated" check additionally guards against
    //          duplicate creation when an Equipment somehow survives but a
    //          matching FileConnector exists with the same source+target+coords.
    //   4. Durable mapping. The returned report has one item per processed
    //      Equipment, naming the action taken and the new connector id
    //      (or the reason for skip). Operator can audit/grep failures.
    //   5. Pairing only when unambiguous. Codex flagged that the naive
    //      "A.target == B.source AND B.target == A.source" pairing fabricates
    //      relationships when there are multiple connectors between the same
    //      two files. The pairing pass here only links when EXACTLY 1:1
    //      A↔B exists — multi-on-either-side is reported as
    //      "unpairedMultipleCandidates" for manual review (via the link
    //      endpoint).
    // ------------------------------------------------------------------------

    /**
     * Walk all Equipment with {@code eqType.name = 'connector'} and convert
     * each to a {@link FileConnector} when safe, then pair connectors that
     * point at each other when unambiguous.
     *
     * <p>{@code Propagation.NOT_SUPPORTED} suspends any ambient transaction
     * (the class is {@code @Transactional} for the rest of its methods) so
     * each item's work runs in its OWN {@code REQUIRES_NEW} tx inside the
     * {@link ConnectorMigrationItemRunner}. This makes partial success
     * recoverable — one row's failure can't roll back rows that already
     * committed, and the per-item report stays consistent with DB state.
     * Codex pre-build review explicitly flagged this as the correct fix
     * (try/catch + class @Transactional would still mark the outer tx as
     * rollback-only).
     *
     * @param dryRun        when true, no DB writes — the report shows what
     *                      WOULD happen (including would-be pairings)
     * @param minTagLength  override the default tag-length floor (5);
     *                      values below 3 are clamped to 3 to prevent
     *                      runaway substring matches
     */
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public ConnectorMigrationReportDto migrateFromEquipment(boolean dryRun, int minTagLength) {
        int floor = Math.max(3, minTagLength);
        // List ids only — we don't want detached Equipment objects floating
        // around while we open separate per-item transactions below.
        List<Long> equipmentIds = equipmentRepo.findByEqTypeNameIgnoreCase("connector").stream()
            .map(Equipment::getId)
            .toList();
        log.info("connector-migration: starting (dryRun={}, minTagLength={}, candidates={})",
            dryRun, floor, equipmentIds.size());

        List<ConnectorMigrationItemDto> items = new ArrayList<>();
        int migrated = 0, skipShortTag = 0, skipHasData = 0, skipNoSource = 0;
        int skipNoMatch = 0, skipAmbiguous = 0, skipAlreadyMigrated = 0;
        int failed = 0;

        for (Long eqId : equipmentIds) {
            ConnectorMigrationItemDto entry;
            try {
                // Each call is a fresh tx — partial failure isolated to this item.
                entry = itemRunner.processOne(eqId, dryRun, floor);
            } catch (RuntimeException ex) {
                // Item's REQUIRES_NEW tx rolled back; outer is still clean.
                log.warn("connector-migration: item #{} failed: {}", eqId, ex.getMessage());
                entry = new ConnectorMigrationItemDto(eqId, null, null, "FAILED",
                    null, null, ex.getMessage());
                failed++;
            }
            items.add(entry);
            switch (entry.action()) {
                case "MIGRATED" -> migrated++;
                case "DRY_RUN" -> migrated++; // counts what WOULD have happened
                case "SKIP_SHORT_TAG" -> skipShortTag++;
                case "SKIP_HAS_DATA" -> skipHasData++;
                case "SKIP_NO_SOURCE_FILE" -> skipNoSource++;
                case "SKIP_NO_MATCH" -> skipNoMatch++;
                case "SKIP_AMBIGUOUS" -> skipAmbiguous++;
                case "SKIP_ALREADY_MIGRATED" -> skipAlreadyMigrated++;
                default -> { /* FAILED / SKIP_NOT_FOUND counted via 'failed' or shown in items list */ }
            }
        }

        // Second pass: pair connectors that point at each other when UNAMBIGUOUS.
        // Dry-run gets SIMULATED counts (no writes) so the report doesn't
        // underestimate impact — codex flagged that the previous version only
        // showed would-create rows, not would-pair rows.
        int[] pairCounts = computePairCounts(dryRun);
        int paired = pairCounts[0];
        int unpaired = pairCounts[1];

        log.info("connector-migration: done. migrated={} failed={} pair-pass={}/{} skips=(short={},data={},noSrc={},noMatch={},ambig={},already={})",
            migrated, failed, paired, paired + unpaired,
            skipShortTag, skipHasData, skipNoSource, skipNoMatch, skipAmbiguous, skipAlreadyMigrated);

        return new ConnectorMigrationReportDto(
            dryRun, equipmentIds.size(), migrated,
            skipShortTag, skipHasData, skipNoSource,
            skipNoMatch, skipAmbiguous, skipAlreadyMigrated,
            paired, unpaired, items
        );
    }

    /**
     * Auto-pair every connector that has no counterpartConnectorId yet, but
     * ONLY when there's exactly one candidate on each side. Codex flagged
     * two bugs in an earlier version:
     * <ul>
     *   <li>"Ambiguous" was counted TWICE for N↔M cases — once when we
     *       processed the forward bucket, once when we processed the reverse
     *       bucket. Fixed here by deduping on a normalized unordered file-pair
     *       key (min,max) so each unordered pair is counted at most once.</li>
     *   <li>Dry-run skipped this pass entirely, hiding what the migration
     *       WOULD pair. Fixed by passing {@code dryRun} — same logic runs but
     *       saveAndFlush is skipped, returning the would-pair counts.</li>
     * </ul>
     * Returns {@code int[] { paired, unpairedAmbiguous }}.
     */
    private int[] computePairCounts(boolean dryRun) {
        List<FileConnector> all = connectorRepo.findAll().stream()
            .filter(c -> c.getCounterpartConnectorId() == null
                      && c.getSourceFile() != null && c.getTargetFile() != null)
            .toList();

        // Bucket by ordered (source, target) so we can ask "how many connectors
        // go from file X to file Y" in O(1) inside the loop.
        Map<String, List<FileConnector>> bySrcTgt = new HashMap<>();
        for (FileConnector c : all) {
            String key = c.getSourceFile().getId() + "→" + c.getTargetFile().getId();
            bySrcTgt.computeIfAbsent(key, k -> new ArrayList<>()).add(c);
        }

        int paired = 0;
        // Track per-FILE-PAIR (unordered) ambiguity so we count each ambiguous
        // pair once total — not once per direction (codex bug fix). Key is
        // "minId↔maxId" so file 1↔file 2 and file 2↔file 1 normalize to the
        // same string.
        Set<String> ambiguousPairKeys = new HashSet<>();
        Set<Long> processed = new HashSet<>();

        for (FileConnector a : all) {
            if (processed.contains(a.getId())) continue;
            long srcId = a.getSourceFile().getId();
            long tgtId = a.getTargetFile().getId();
            String forwardKey = srcId + "→" + tgtId;
            String reverseKey = tgtId + "→" + srcId;
            String pairKey = (srcId < tgtId ? srcId + "↔" + tgtId : tgtId + "↔" + srcId);

            List<FileConnector> forwardBucket = bySrcTgt.getOrDefault(forwardKey, List.of());
            List<FileConnector> reverseBucket = bySrcTgt.getOrDefault(reverseKey, List.of());

            // Auto-pair only when EXACTLY 1:1 (one connector each direction).
            // Anything else (1-N, N-1, N-M) is ambiguous → manual pairing.
            if (forwardBucket.size() == 1 && reverseBucket.size() == 1) {
                FileConnector b = reverseBucket.get(0);
                if (processed.contains(b.getId())) continue;
                if (!dryRun) {
                    a.setCounterpartConnectorId(b.getId());
                    b.setCounterpartConnectorId(a.getId());
                    connectorRepo.saveAndFlush(a);
                    connectorRepo.saveAndFlush(b);
                }
                processed.add(a.getId());
                processed.add(b.getId());
                paired++;
            } else if (!reverseBucket.isEmpty()) {
                // Reverse side has candidates → ambiguous (N-M or 1-N or N-1).
                // Dedupe on the unordered file-pair key so we count exactly once.
                ambiguousPairKeys.add(pairKey);
                // Mark both directions' buckets processed so we skip them.
                for (FileConnector c : forwardBucket) processed.add(c.getId());
                for (FileConnector c : reverseBucket) processed.add(c.getId());
            }
        }

        return new int[]{ paired, ambiguousPairKeys.size() };
    }

    // ========================================================================
    // Re-sync existing FileConnectors to clients
    // ========================================================================
    //
    // Recovery for the "migration ran before sync infrastructure was aware of
    // FileConnector" gap: original creation events fired through
    // FieldChangeEntityListener, but clients couldn't apply them — at the
    // time, ServiceFacade.getService("FileConnector") returned null. The
    // events were silently dropped on the receiving side; the client's sync
    // token then advanced past those FieldChange records so a normal delta
    // sync won't replay them.
    //
    // This method calls FieldChangeTracker.trackEntityCreation directly for
    // each connector, generating FRESH FieldChange records with current
    // timestamps. Clients see them as new creation events on next pull and
    // apply them through the now-registered FileConnector service.

    /**
     * Re-emit creation events for every active FileConnector so clients with
     * a sync token past the original migration timestamp pick them up. Safe
     * to re-run — the apply path on clients is upsert-by-id so duplicates
     * are de-duped automatically.
     */
    public ResyncResultDto resyncAllToClients() {
        List<FileConnector> all = connectorRepo.findAll().stream()
            .filter(c -> c.getDeleted() == null || !c.getDeleted())
            .toList();
        int emitted = 0;
        int failed = 0;
        for (FileConnector c : all) {
            try {
                fieldChangeTracker.trackEntityCreation(c);
                emitted++;
            } catch (RuntimeException ex) {
                log.warn("resync-to-clients: failed for FileConnector #{}: {}", c.getId(), ex.getMessage());
                failed++;
            }
        }
        log.info("resync-to-clients: re-emitted {} FileConnector creation events ({} failed of {} total)",
            emitted, failed, all.size());
        return new ResyncResultDto(all.size(), emitted, failed);
    }

    public record ResyncResultDto(int totalScanned, int emitted, int failed) {}

    // ========================================================================
    // Inline edit-to-migrate for legacy connectors
    // ========================================================================
    //
    // The bulk migration handles the easy cases (1 candidate, tag long enough,
    // no data attached). The leftovers are SKIP_AMBIGUOUS, SKIP_NO_MATCH, and
    // SKIP_SHORT_TAG rows — they can't be auto-migrated, but the user knows
    // exactly where each one points. These two methods support the loto-builder
    // edit dialog: load the row's context + candidate files, then commit a
    // migration with the user's chosen target. Bypasses the matching heuristic.

    /**
     * Load context for the dialog. Returns the equipment's tag, source-file
     * info, and the list of files whose fileNumber contains the tag (the
     * SAME candidates the auto-migration would consider). Frontend renders
     * these as quick-pick options; if none fit, the user can pick from the
     * full file list via the standard picker.
     *
     * <p>Read-only — no transaction needs to commit anything.
     */
    @Transactional(readOnly = true)
    public LegacyConnectorContextDto getLegacyConnectorContext(Long equipmentId) {
        Equipment eq = equipmentRepo.findById(equipmentId)
            .orElseThrow(() -> new RuntimeException("Equipment not found: " + equipmentId));

        String tag = eq.getTagNumber() == null ? "" : eq.getTagNumber().trim();
        FileObject source = eq.getMainFile();
        Long srcId = source != null ? source.getId() : null;
        String srcNumber = source != null ? source.getFileNumber() : null;
        String srcName = source != null ? source.getName() : null;

        // Reason hint — surface why auto-migration skipped (so the dialog
        // can say "tag too short" up-front instead of just showing 0 candidates).
        String skipReason = null;
        if (tag.length() < DEFAULT_MIN_TAG_LENGTH) {
            skipReason = "tag length " + tag.length() + " is below the auto-match floor ("
                       + DEFAULT_MIN_TAG_LENGTH + ") — pick the target manually";
        }

        List<LegacyConnectorContextDto.CandidateFile> candidates = tag.isEmpty()
            ? List.of()
            : fileRepo.findByFileNumberContaining(tag).stream()
                // Don't suggest the source file as its own target.
                .filter(f -> srcId == null || !srcId.equals(f.getId()))
                .map(f -> new LegacyConnectorContextDto.CandidateFile(
                    f.getId(), f.getFileNumber(), f.getName(), f.getFileLink()))
                .toList();

        return new LegacyConnectorContextDto(
            equipmentId, tag, srcId, srcNumber, srcName, candidates, skipReason);
    }

    /**
     * Commit the inline migration with the user-picked target. Delegates to
     * {@link ConnectorMigrationItemRunner#processOneWithTarget} — same audit
     * shape as the bulk migration so the frontend handles success/skip/fail
     * uniformly. After a successful migration, re-emits the creation event
     * so any other connected client picks up the new FileConnector on its
     * next sync pull.
     *
     * <p>{@code NOT_SUPPORTED} suspends this service's ambient tx so the
     * runner's {@code REQUIRES_NEW} is the only commit boundary — same
     * pattern as the bulk migration.
     */
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public ConnectorMigrationItemDto migrateOneWithTarget(Long equipmentId, Long targetFileId) {
        ConnectorMigrationItemDto entry;
        try {
            entry = itemRunner.processOneWithTarget(equipmentId, targetFileId);
        } catch (RuntimeException ex) {
            log.warn("inline-migrate: Equipment #{} → File #{} failed: {}", equipmentId, targetFileId, ex.getMessage());
            return new ConnectorMigrationItemDto(equipmentId, null, null, "FAILED",
                null, targetFileId != null ? List.of(targetFileId) : null, ex.getMessage());
        }
        // Re-emit so peers pick up the new connector without waiting for a
        // bulk re-sync. trackEntityCreation is the same path the
        // FieldChangeEntityListener uses on save — failures here don't
        // poison the report; the user's local edit already committed.
        if ("MIGRATED".equals(entry.action()) && entry.newConnectorId() != null) {
            connectorRepo.findById(entry.newConnectorId()).ifPresent(c -> {
                try { fieldChangeTracker.trackEntityCreation(c); }
                catch (RuntimeException ex) {
                    log.warn("inline-migrate: re-emit failed for FileConnector #{}: {}",
                        c.getId(), ex.getMessage());
                }
            });
        }
        return entry;
    }
}
