package com.dk_power.power_plant_java.sevice.angular.file;

import com.dk_power.power_plant_java.dto.files.ConnectorMigrationItemDto;
import com.dk_power.power_plant_java.dto.files.ConnectorMigrationReportDto;
import com.dk_power.power_plant_java.dto.files.FileConnectorDto;
import com.dk_power.power_plant_java.dto.files.FileConnectorIdDto;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.files.FileConnector;
import com.dk_power.power_plant_java.mappers.FileConnectorMapper;
import com.dk_power.power_plant_java.repository.equipment.EquipmentRepo;
import com.dk_power.power_plant_java.repository.file.FileConnectorRepo;
import lombok.RequiredArgsConstructor;
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
public class NgFileConnectorService {
    private static final Logger log = LoggerFactory.getLogger(NgFileConnectorService.class);

    private final FileConnectorRepo connectorRepo;
    private final FileConnectorMapper connectorMapper;
    private final EquipmentRepo equipmentRepo;
    private final ConnectorMigrationItemRunner itemRunner;

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
     */
    public FileConnectorDto save(FileConnectorIdDto dto) {
        FileConnector entity = connectorMapper.convertIdDtoToEntity(dto);
        if (entity.getSourceFile() == null || entity.getTargetFile() == null) {
            throw new RuntimeException("FileConnector requires both sourceFile and targetFile to resolve");
        }
        FileConnector saved = connectorRepo.save(entity);
        return connectorMapper.convertToDto(saved);
    }

    /**
     * Soft-delete by id. ALSO clears the surviving counterpart's
     * counterpartConnectorId so it doesn't reference a deleted row.
     */
    public void softDelete(Long id) {
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
}
