package com.dk_power.power_plant_java.sevice.angular.file;

import com.dk_power.power_plant_java.dto.files.ConnectorMigrationItemDto;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.files.FileConnector;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.repository.equipment.EquipmentRepo;
import com.dk_power.power_plant_java.repository.file.FileConnectorRepo;
import com.dk_power.power_plant_java.repository.file.FileRepo;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

/**
 * Per-item runner for the connector migration — each call runs in its OWN
 * transaction ({@code Propagation.REQUIRES_NEW}) so one Equipment row's
 * failure can't roll back rows that already succeeded.
 *
 * <p>Codex pre-build review flagged that the original implementation had
 * everything in a single class-level {@code @Transactional} migration method,
 * meaning a runtime failure on row N would roll back rows 1..N-1 too, making
 * the per-item report inconsistent with actual DB state. This class is the
 * fix: outer loop in {@link NgFileConnectorService} runs WITHOUT a tx and
 * calls {@link #processOne} per row; that method is its own atomic unit.
 *
 * <p>{@code saveAndFlush} forces the INSERT/UPDATE to commit inside this
 * item's transaction (not deferred to a later commit boundary), so a JPA
 * constraint failure manifests inside the item's catch block instead of
 * resurfacing during outer commit and corrupting the report.
 */
@Component
@RequiredArgsConstructor
public class ConnectorMigrationItemRunner {
    private static final Logger log = LoggerFactory.getLogger(ConnectorMigrationItemRunner.class);

    private final FileConnectorRepo connectorRepo;
    private final EquipmentRepo equipmentRepo;
    private final FileRepo fileRepo;

    /**
     * Apply the 5-gate migration logic to a single Equipment row. Each call
     * runs in its own transaction — caller catches any throw and records a
     * failure entry in the report without affecting other items.
     *
     * @return the audit entry describing what was done (or why we skipped)
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public ConnectorMigrationItemDto processOne(Long equipmentId, boolean dryRun, int minTagLength) {
        Optional<Equipment> opt = equipmentRepo.findById(equipmentId);
        if (opt.isEmpty()) {
            // Equipment was removed between the listing query and this call.
            return new ConnectorMigrationItemDto(equipmentId, null, null, "SKIP_NOT_FOUND",
                null, null, "Equipment no longer present (concurrent modification?)");
        }
        Equipment eq = opt.get();
        String tag = eq.getTagNumber() == null ? "" : eq.getTagNumber().trim();
        Long srcFileId = eq.getMainFile() != null ? eq.getMainFile().getId() : null;

        // Gate 1: tag-length floor
        if (tag.length() < minTagLength) {
            return new ConnectorMigrationItemDto(equipmentId, tag, srcFileId, "SKIP_SHORT_TAG",
                null, null, "tagNumber length " + tag.length() + " < minTagLength " + minTagLength);
        }

        // Gate 2: data-cleanliness — refuse to silently drop semantic data.
        //
        // SUBTLE: every saved Equipment has its mainFile in the `files`
        // ManyToMany too — Equipment.setMainFile() calls addFile(mainFile) so
        // the mainFile shows up on both sides of the relationship. That means
        // "files is non-empty" is essentially ALWAYS true and was rejecting
        // every connector. Real gate is "files contains anything BEYOND
        // mainFile" (a cross-reference to additional files) and "any
        // lotoPoints at all."
        int lotoCount = eq.getLotoPoints() == null ? 0 : eq.getLotoPoints().size();
        Long mainFileId = eq.getMainFile() != null ? eq.getMainFile().getId() : null;
        int extraFileCount = eq.getFiles() == null ? 0 : (int) eq.getFiles().stream()
            .filter(f -> f != null && f.getId() != null
                      && (mainFileId == null || !f.getId().equals(mainFileId)))
            .count();
        if (lotoCount > 0 || extraFileCount > 0) {
            return new ConnectorMigrationItemDto(equipmentId, tag, srcFileId, "SKIP_HAS_DATA",
                null, null,
                "attached lotoPoints=" + lotoCount + " extra-file-refs=" + extraFileCount
                + " (beyond mainFile) — would lose data");
        }

        // Gate 3: must have a source file (mainFile)
        if (eq.getMainFile() == null) {
            return new ConnectorMigrationItemDto(equipmentId, tag, null, "SKIP_NO_SOURCE_FILE",
                null, null, "Equipment.mainFile is null");
        }

        // Gate 4: candidate file lookup. 1 match → auto. 0 or N → manual.
        List<FileObject> candidates = fileRepo.findByFileNumberContaining(tag);
        if (candidates.isEmpty()) {
            return new ConnectorMigrationItemDto(equipmentId, tag, srcFileId, "SKIP_NO_MATCH",
                null, null, "no FileObject fileNumber contains \"" + tag + "\"");
        }
        if (candidates.size() > 1) {
            List<Long> candidateIds = candidates.stream().map(FileObject::getId).toList();
            return new ConnectorMigrationItemDto(equipmentId, tag, srcFileId, "SKIP_AMBIGUOUS",
                null, candidateIds,
                candidates.size() + " files match — manual selection needed");
        }

        FileObject target = candidates.get(0);
        FileObject source = eq.getMainFile();

        // Gate 5: idempotency. ASSUMES Equipment.coordinates is written by ONE
        // renderer path with stable string format (no whitespace / key-order
        // variance across runs). Holds for current data path but codex flagged
        // this as fragile — if a future renderer normalizes differently, this
        // dedupe will miss and create duplicates. Defensible workaround would
        // be a normalized-hash column, deferred to a follow-up.
        boolean alreadyExists = connectorRepo.findBySourceAndTarget(source.getId(), target.getId())
            .stream().anyMatch(c -> Objects.equals(c.getCoordinates(), eq.getCoordinates()));
        if (alreadyExists) {
            if (!dryRun) {
                // Clean up the stray Equipment that survived a prior partial run.
                eq.setDeleted(true);
                equipmentRepo.saveAndFlush(eq);
            }
            return new ConnectorMigrationItemDto(equipmentId, tag, srcFileId, "SKIP_ALREADY_MIGRATED",
                null, List.of(target.getId()),
                "matching FileConnector exists — soft-deleted stray Equipment");
        }

        if (dryRun) {
            return new ConnectorMigrationItemDto(equipmentId, tag, srcFileId, "DRY_RUN",
                null, List.of(target.getId()),
                "would migrate to FileConnector targeting file #" + target.getId());
        }

        // Create the FileConnector + soft-delete the source Equipment, both
        // flushed before this item's tx commits so any constraint violation
        // surfaces here (not in the outer commit, where it could corrupt the
        // partial-success report by appearing to succeed earlier rows).
        FileConnector connector = new FileConnector();
        connector.setSourceFile(source);
        connector.setTargetFile(target);
        connector.setCoordinates(eq.getCoordinates());
        connector.setOriginalPictureSize(eq.getOriginalPictureSize());
        connector.setRotation(eq.getRotation());
        connector.setSymbolId(eq.getSymbolId());
        connector.setSvgPath(eq.getSvgPath());
        FileConnector saved = connectorRepo.saveAndFlush(connector);

        eq.setDeleted(true);
        equipmentRepo.saveAndFlush(eq);

        log.debug("Migrated Equipment #{} → FileConnector #{}", equipmentId, saved.getId());
        return new ConnectorMigrationItemDto(equipmentId, tag, srcFileId, "MIGRATED",
            saved.getId(), List.of(target.getId()),
            "FileConnector #" + saved.getId() + " created; Equipment soft-deleted");
    }

    /**
     * Manual variant of {@link #processOne} used by the inline edit-to-migrate
     * flow in the loto-builder. Skips gates 1, 4 (tag length, candidate lookup)
     * because the user has explicitly chosen the target file — we trust the
     * user's pick over the substring heuristic. Still enforces:
     * <ul>
     *   <li>Equipment exists (non-deleted) — defensive against concurrent fixes</li>
     *   <li>Data-cleanliness (no extra files / no LotoPoints) — same as auto</li>
     *   <li>Source file present</li>
     *   <li>Target file exists and isn't the same as source (no self-link)</li>
     *   <li>Idempotency — bail if a matching FileConnector already exists</li>
     * </ul>
     * Same {@code REQUIRES_NEW} isolation so a failure here doesn't poison
     * any ambient tx. Returns the same audit shape so the frontend can show
     * a uniform success/failure response.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public ConnectorMigrationItemDto processOneWithTarget(Long equipmentId, Long targetFileId) {
        Optional<Equipment> opt = equipmentRepo.findById(equipmentId);
        if (opt.isEmpty()) {
            return new ConnectorMigrationItemDto(equipmentId, null, null, "SKIP_NOT_FOUND",
                null, null, "Equipment no longer present");
        }
        Equipment eq = opt.get();
        String tag = eq.getTagNumber() == null ? "" : eq.getTagNumber().trim();
        Long srcFileId = eq.getMainFile() != null ? eq.getMainFile().getId() : null;

        int lotoCount = eq.getLotoPoints() == null ? 0 : eq.getLotoPoints().size();
        Long mainFileId = eq.getMainFile() != null ? eq.getMainFile().getId() : null;
        int extraFileCount = eq.getFiles() == null ? 0 : (int) eq.getFiles().stream()
            .filter(f -> f != null && f.getId() != null
                      && (mainFileId == null || !f.getId().equals(mainFileId)))
            .count();
        if (lotoCount > 0 || extraFileCount > 0) {
            return new ConnectorMigrationItemDto(equipmentId, tag, srcFileId, "SKIP_HAS_DATA",
                null, null,
                "attached lotoPoints=" + lotoCount + " extra-file-refs=" + extraFileCount
                + " (beyond mainFile) — refusing to lose data");
        }
        if (eq.getMainFile() == null) {
            return new ConnectorMigrationItemDto(equipmentId, tag, null, "SKIP_NO_SOURCE_FILE",
                null, null, "Equipment.mainFile is null");
        }
        if (targetFileId == null) {
            return new ConnectorMigrationItemDto(equipmentId, tag, srcFileId, "FAILED",
                null, null, "no target file specified");
        }
        if (targetFileId.equals(srcFileId)) {
            return new ConnectorMigrationItemDto(equipmentId, tag, srcFileId, "FAILED",
                null, List.of(targetFileId), "target file is same as source — self-link not allowed");
        }
        Optional<FileObject> targetOpt = fileRepo.findById(targetFileId);
        if (targetOpt.isEmpty()) {
            return new ConnectorMigrationItemDto(equipmentId, tag, srcFileId, "FAILED",
                null, List.of(targetFileId), "target file not found");
        }
        FileObject target = targetOpt.get();
        FileObject source = eq.getMainFile();

        boolean alreadyExists = connectorRepo.findBySourceAndTarget(source.getId(), target.getId())
            .stream().anyMatch(c -> Objects.equals(c.getCoordinates(), eq.getCoordinates()));
        if (alreadyExists) {
            // A prior partial run left both the Equipment and a matching connector.
            // Same cleanup as the auto path so the operator can repeat safely.
            eq.setDeleted(true);
            equipmentRepo.saveAndFlush(eq);
            return new ConnectorMigrationItemDto(equipmentId, tag, srcFileId, "SKIP_ALREADY_MIGRATED",
                null, List.of(target.getId()),
                "matching FileConnector exists — soft-deleted stray Equipment");
        }

        FileConnector connector = new FileConnector();
        connector.setSourceFile(source);
        connector.setTargetFile(target);
        connector.setCoordinates(eq.getCoordinates());
        connector.setOriginalPictureSize(eq.getOriginalPictureSize());
        connector.setRotation(eq.getRotation());
        connector.setSymbolId(eq.getSymbolId());
        connector.setSvgPath(eq.getSvgPath());
        FileConnector saved = connectorRepo.saveAndFlush(connector);

        eq.setDeleted(true);
        equipmentRepo.saveAndFlush(eq);

        log.info("Inline-migrated Equipment #{} → FileConnector #{} (user-picked target #{})",
            equipmentId, saved.getId(), target.getId());
        return new ConnectorMigrationItemDto(equipmentId, tag, srcFileId, "MIGRATED",
            saved.getId(), List.of(target.getId()),
            "FileConnector #" + saved.getId() + " created with user-picked target; Equipment soft-deleted");
    }
}
