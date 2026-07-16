package com.dk_power.power_plant_java.sevice.angular.file;

import com.dk_power.power_plant_java.dto.files.clone.AcceptSuggestionsRequestDto;
import com.dk_power.power_plant_java.dto.files.clone.AcceptSuggestionsResultDto;
import com.dk_power.power_plant_java.dto.files.clone.AcceptedSuggestionItemDto;
import com.dk_power.power_plant_java.dto.files.clone.CloneFileResultDto;
import com.dk_power.power_plant_java.dto.files.clone.CloneSummaryDto;
import com.dk_power.power_plant_java.dto.files.clone.CounterpartCandidateDto;
import com.dk_power.power_plant_java.dto.files.clone.ImportFromCounterpartResultDto;
import com.dk_power.power_plant_java.dto.files.clone.LotoSuggestionDto;
import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointDto;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.repository.equipment.EquipmentRepo;
import com.dk_power.power_plant_java.repository.file.FileRepo;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoPointService;
import com.dk_power.power_plant_java.sevice.equipment.EquipmentService;
import com.dk_power.power_plant_java.sevice.file.FileService;
import com.dk_power.power_plant_java.sevice.loto.loto_point.LotoPointService;
import com.dk_power.power_plant_java.sevice.sync.FileObjectSyncHandler;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Clone-to-unit: given a fully-processed P&ID FileObject on Unit 1, build the
 * Unit 2 counterpart (or reverse). Copies the disk file with a swapped name,
 * clones the FileObject metadata + every Equipment "highlight" on it, and for
 * each LOTO point either auto-links its counterpart (when a real DB row exists)
 * or surfaces it as a {@link LotoSuggestionDto} for explicit user review.
 *
 * <p>Counterpart resolution reuses {@link NgLotoPointService#findUnitCounterpart}
 * so the tag-swap convention and DB lookup logic live in one place.
 *
 * <p>Why a fresh service rather than extending {@code FileServiceImpl.copyFromAnotherUnit}:
 * the existing path requires the destination FileObject to already exist AND
 * auto-saves LotoPoints via {@code LotoPointService.copyPointFromOtherUnit}.
 * Both are wrong for this UX — the user wants the clone created end-to-end in
 * one click, and they want to REVIEW unsaved suggestions instead of silently
 * persisting them.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class NgFileCloneService {

    private static final Logger log = LoggerFactory.getLogger(NgFileCloneService.class);

    private final FileService fileService;
    private final FileRepo fileRepo;
    private final EquipmentRepo equipmentRepo;
    private final EquipmentService equipmentService;
    private final NgLotoPointService ngLotoPointService;
    private final LotoPointService lotoPointService;

    // The FieldChange sync channel carries only the FileObject ROW; the actual file bytes ride the
    // separate PendingFileSync queue (FileObjectSyncHandler). For a normal upload the automatic
    // "FileObject changed -> queue upload" hook (fired from the CREATE emission's afterCommit) handles
    // that. It does NOT fire cleanly for the clone: the clone's mid-transaction saveAndFlush makes the
    // hook run during the outer flush (reentrant, before the disk copy), so no upload task is enqueued
    // and the hub never receives the cloned file. We therefore trigger the upload explicitly at the end
    // of the clone. @Lazy field injection avoids the FileObjectSyncHandler dependency cycle (the same
    // reason FieldChangeTracker wires it via a setter).
    @Lazy
    @Autowired
    private FileObjectSyncHandler fileObjectSyncHandler;

    @Value("${files.root.path}")
    private String filesRootPath;

    // ------------------------------------------------------------------------
    // PUBLIC API
    // ------------------------------------------------------------------------

    /**
     * Clone the given source FileObject to the other unit.
     * @param sourceFileId source FileObject id
     * @param force        when false and a prior clone exists, returns status="exists"
     *                     instead of creating another (so the UI can confirm).
     */
    public CloneFileResultDto cloneToUnit(Long sourceFileId, boolean force) {
        FileObject source = fileRepo.findById(sourceFileId).orElse(null);
        if (source == null) {
            return error(sourceFileId, "Source file " + sourceFileId + " not found");
        }

        // Existing clone detection — bidirectional. Covers two cases:
        //   1. Source has been cloned before        → find rows where clonedFromId = sourceId
        //   2. Source is itself a clone of another  → that parent IS the existing counterpart,
        //      so re-cloning would create a duplicate of the original. Include it
        //      explicitly because `findByClonedFromId(sourceId)` wouldn't surface it.
        List<Long> existingCloneIds = new ArrayList<>(
            fileRepo.findByClonedFromId(sourceFileId).stream().map(FileObject::getId).toList()
        );
        if (source.getClonedFromId() != null && !existingCloneIds.contains(source.getClonedFromId())) {
            existingCloneIds.add(source.getClonedFromId());
        }
        if (!existingCloneIds.isEmpty() && !force) {
            return new CloneFileResultDto(
                "exists", sourceFileId, null, existingCloneIds,
                null, null, null, List.of(), null
            );
        }

        String sourceUnit = detectSourceUnit(source);
        if (sourceUnit == null) {
            return error(sourceFileId, "Could not detect source unit (01/02) — file has no unit-tagged LOTO points and no U1/U2 marker in its file number");
        }
        String targetUnit = sourceUnit.equals("01") ? "02" : "01";

        // Compute new file number (transform-then-disambiguate if force re-clone produced a collision)
        String newFileNumber = computeUniqueTargetFileNumber(source, sourceUnit, targetUnit);

        // 1. Build & save the cloned FileObject (metadata). Save first so we get an
        //    ID; disk copy and equipment cloning happen below. If any later step
        //    throws, @Transactional rolls back the FileObject save.
        FileObject clone = buildCloneFileObject(source, newFileNumber, targetUnit);
        clone = fileService.save(clone);
        log.info("clone-to-unit: created FileObject #{} from source #{} (unit {}→{})",
                 clone.getId(), source.getId(), sourceUnit, targetUnit);

        // 1b. Wire bidirectional counterpartId. Mirrors LotoPoint.counterpartId so
        //     "Open Counterpart File" navigation works in both directions. On re-clone
        //     (force=true), the source's pointer moves to the newest clone — the older
        //     clone's pointer back to source still resolves.
        //
        //     Use saveAndFlush rather than save() so the UPDATE SQL fires
        //     immediately instead of being deferred to the @Transactional commit
        //     boundary. Without the explicit flush, the in-memory mutation is
        //     correct but downstream paths in this same transaction (sync
        //     emission, equipment cloning) can observe the entity in a stale
        //     state, and any later rollback from a failed equipment/disk step
        //     would silently lose the counterpart link.
        clone.setCounterpartId(source.getId());
        source.setCounterpartId(clone.getId());
        fileRepo.saveAndFlush(source);
        fileRepo.saveAndFlush(clone);
        log.info("clone-to-unit: linked counterpart #{} ↔ #{}", source.getId(), clone.getId());

        // 2. Disk copy (each extension the source has). NOT transactional — done
        //    AFTER the metadata save so any DB error above prevents wasted I/O.
        int diskCopied = copyDiskFiles(source, clone);

        // 2b. Explicitly enqueue the cloned file's bytes for sync to the hub. The FieldChange channel
        //     only syncs the FileObject row; without this the hub gets the row but never the file.
        //     Idempotent (queueFileUpload dedups) and hub-aware (onLocalFileObjectChanged registers the
        //     file for download-serving when this runs on the hub). See the field comment for why the
        //     automatic hook doesn't cover the clone.
        fileObjectSyncHandler.onLocalFileObjectChanged(clone, true);

        // 3. Clone each equipment and resolve its LOTO points.
        EquipmentImportResult eqResult = cloneEquipmentAndLotoFrom(source, clone, sourceUnit, targetUnit);

        CloneSummaryDto summary = new CloneSummaryDto(
            eqResult.equipmentCount, eqResult.autoLinked, eqResult.suggestions.size(),
            eqResult.reused, diskCopied
        );
        return new CloneFileResultDto(
            "created", sourceFileId, clone.getId(), existingCloneIds,
            sourceUnit, targetUnit, summary, eqResult.suggestions, null
        );
    }

    /**
     * Shared core: clone every Equipment on {@code source} into {@code target},
     * transforming text fields fromUnit→toUnit, and resolve each source
     * Equipment's LOTO points (auto-link real DB counterparts / surface
     * suggestions for missing ones / reuse non-unit-specific points).
     *
     * <p>Used by {@link #cloneToUnit} when building a brand-new clone file, and
     * by {@link #importFromCounterpart} when populating an EXISTING file from
     * its already-linked counterpart. The latter case may pre-clear the
     * target's existing equipment first (soft-delete).
     */
    private EquipmentImportResult cloneEquipmentAndLotoFrom(
            FileObject source, FileObject target, String sourceUnit, String targetUnit) {
        List<Equipment> sourceEquipment = equipmentRepo.findByMainFile_Id(source.getId());
        EquipmentImportResult out = new EquipmentImportResult();
        out.equipmentCount = sourceEquipment.size();
        for (Equipment srcEq : sourceEquipment) {
            Equipment newEq = cloneEquipment(srcEq, target, sourceUnit, targetUnit);
            newEq = equipmentService.save(newEq);
            EqLotoResolution res = resolveLotoPointsForEquipment(srcEq, newEq);
            out.autoLinked += res.autoLinked;
            out.reused += res.reused;
            out.suggestions.addAll(res.suggestions);
        }
        return out;
    }

    /** Aggregate counts + suggestions from {@link #cloneEquipmentAndLotoFrom}. */
    private static final class EquipmentImportResult {
        int equipmentCount = 0;
        int autoLinked = 0;
        int reused = 0;
        final List<LotoSuggestionDto> suggestions = new ArrayList<>();
    }

    /**
     * Save the user-accepted suggestions: persist each new LotoPoint, link it to
     * its target Equipment, and set the bidirectional counterpartId so future
     * counterpart lookups find it directly.
     *
     * <p>Groups incoming items by {@code sourceLotoPointId} so a shared source
     * point (the same LOTO point attached to N source equipment via the
     * eq_loto_point ManyToMany) produces exactly ONE new counterpart LotoPoint
     * attached to all N cloned equipment — not N duplicates with the same tag.
     * Counterpart linking also happens once per source group, avoiding the
     * counterpartId-thrashing that N independent linkCounterparts calls would
     * cause.
     */
    public AcceptSuggestionsResultDto acceptSuggestions(AcceptSuggestionsRequestDto req) {
        List<String> errors = new ArrayList<>();
        if (req == null || req.items() == null) {
            return new AcceptSuggestionsResultDto(0, 0, errors);
        }

        // Group by source LOTO id so duplicate suggestions (one per cloned
        // equipment) collapse into a single new counterpart that attaches to
        // every named equipment.
        Map<Long, List<AcceptedSuggestionItemDto>> bySource = new java.util.LinkedHashMap<>();
        List<AcceptedSuggestionItemDto> noSource = new ArrayList<>();
        for (AcceptedSuggestionItemDto item : req.items()) {
            if (item == null || item.lotoPoint() == null) continue;
            if (item.sourceLotoPointId() == null) {
                noSource.add(item);
            } else {
                bySource.computeIfAbsent(item.sourceLotoPointId(), k -> new ArrayList<>()).add(item);
            }
        }

        int created = 0;
        int linked = 0;

        // Grouped path — one new LotoPoint per source, fanned out to all named equipment.
        for (var entry : bySource.entrySet()) {
            Long sourceLotoPointId = entry.getKey();
            List<AcceptedSuggestionItemDto> group = entry.getValue();
            AcceptedSuggestionItemDto first = group.get(0);
            String label = first.lotoPoint().getTagNumber() != null ? first.lotoPoint().getTagNumber() : "(no-tag)";
            try {
                LotoPoint newPoint = ngLotoPointService.toEntity(first.lotoPoint());
                newPoint.setId(null);
                newPoint = lotoPointService.save(newPoint);
                created++;

                for (AcceptedSuggestionItemDto item : group) {
                    attachLotoPointToEquipment(item.newEquipmentId(), newPoint);
                }

                // Pre-validate the source still exists before calling linkCounterparts —
                // that method throws RuntimeException when either id is missing, which
                // would mark THIS class's @Transactional tx as rollback-only. The
                // catch below would log the error, but Spring still throws
                // UnexpectedRollbackException at commit time and we'd lose every
                // already-persisted suggestion. Skipping silently with an error
                // entry keeps the partial-success contract intact.
                if (lotoPointService.findById(sourceLotoPointId).isPresent()) {
                    ngLotoPointService.linkCounterparts(sourceLotoPointId, newPoint.getId());
                    linked++;
                } else {
                    errors.add(label + ": source LOTO point " + sourceLotoPointId
                        + " no longer exists — counterpart link skipped");
                }
            } catch (RuntimeException ex) {
                log.warn("clone-to-unit accept: failed for suggestion {}: {}", label, ex.getMessage());
                errors.add(label + ": " + ex.getMessage());
            }
        }

        // Edge case: items without a sourceLotoPointId can't be deduped or counterparted.
        // Still honor the save+attach so the user's accept isn't silently dropped.
        for (AcceptedSuggestionItemDto item : noSource) {
            String label = item.lotoPoint().getTagNumber() != null ? item.lotoPoint().getTagNumber() : "(no-tag)";
            try {
                LotoPoint newPoint = ngLotoPointService.toEntity(item.lotoPoint());
                newPoint.setId(null);
                newPoint = lotoPointService.save(newPoint);
                created++;
                attachLotoPointToEquipment(item.newEquipmentId(), newPoint);
            } catch (RuntimeException ex) {
                log.warn("clone-to-unit accept (no-source): failed for {}: {}", label, ex.getMessage());
                errors.add(label + ": " + ex.getMessage());
            }
        }

        return new AcceptSuggestionsResultDto(created, linked, errors);
    }

    private void attachLotoPointToEquipment(Long equipmentId, LotoPoint point) {
        if (equipmentId == null) return;
        Equipment eq = equipmentRepo.findById(equipmentId).orElse(null);
        if (eq == null) return;
        if (eq.getLotoPoints() == null) eq.setLotoPoints(new HashSet<>());
        eq.addLotoPoint(point);
        equipmentService.save(eq);
    }

    // ------------------------------------------------------------------------
    // Unit detection
    // ------------------------------------------------------------------------

    /**
     * Inspect the source file's LOTO points and (fallback) file number to figure
     * out which unit it belongs to. Returns "01" or "02", or null when neither
     * signal points clearly one way.
     */
    private String detectSourceUnit(FileObject source) {
        Map<String, Integer> tally = new HashMap<>();
        for (Equipment eq : equipmentRepo.findByMainFile_Id(source.getId())) {
            if (eq.getLotoPoints() == null) continue;
            for (LotoPoint lp : eq.getLotoPoints()) {
                String t = lp.getTagNumber();
                if (t == null || t.length() < 2) continue;
                String prefix = t.substring(0, 2);
                if ("01".equals(prefix) || "02".equals(prefix)) {
                    tally.merge(prefix, 1, (a, b) -> a + b);
                }
            }
        }
        int u1 = tally.getOrDefault("01", 0);
        int u2 = tally.getOrDefault("02", 0);
        if (u1 > u2) return "01";
        if (u2 > u1) return "02";

        // Fallback: inspect fileNumber for unit hints.
        String fn = source.getFileNumber();
        if (fn != null) {
            String u = inferUnitFromText(fn);
            if (u != null) return u;
        }
        return null;
    }

    /**
     * Returns "01"/"02" when the text contains a clear unit marker, else null.
     * Case-insensitive to match {@link #transformText}, which already supports
     * all-caps variants ("UNIT 1", "U1", "Unit 2", etc.). Without this, a
     * file named "UNIT 1 ESSENTIAL SERVICE BUS TCP" with no LOTO points would
     * fail clone-to-unit with "Could not detect source unit" even though the
     * unit is obvious to a human.
     */
    private String inferUnitFromText(String text) {
        if (text == null) return null;
        String upper = text.toUpperCase();
        if (upper.contains("U1") || upper.contains("UNIT1") || upper.contains("UNIT 1")) return "01";
        if (upper.contains("U2") || upper.contains("UNIT2") || upper.contains("UNIT 2")) return "02";
        for (String token : text.split("[\\s_\\-./]+")) {
            if (token.startsWith("01")) return "01";
            if (token.startsWith("02")) return "02";
        }
        return null;
    }

    // ------------------------------------------------------------------------
    // Metadata clone
    // ------------------------------------------------------------------------

    private FileObject buildCloneFileObject(FileObject source, String newFileNumber, String targetUnit) {
        FileObject clone = new FileObject();
        clone.setName(transformText(source.getName(), other(targetUnit), targetUnit));
        clone.setFileType(source.getFileType());
        clone.setVendor(source.getVendor());
        clone.setSystem(source.getSystem());
        clone.setBaseLink(source.getBaseLink());
        clone.setFileNumber(newFileNumber);
        clone.setExtension(source.getExtension());
        clone.setExtensions(source.getExtensions());
        clone.setDocNum(source.getDocNum());
        // ManyToMany Value refs are shared catalog rows — wire the same instances.
        if (source.getSystems() != null) clone.setSystems(new HashSet<>(source.getSystems()));
        if (source.getTags() != null) clone.setTags(new HashSet<>(source.getTags()));
        // Legacy CSV — copy through unchanged (it'll be migrated/dropped over time).
        if (source.getRelatedSystems() != null) clone.setRelatedSystems(source.getRelatedSystems());
        clone.setCompleted(Boolean.FALSE);
        clone.setIsVerified(Boolean.FALSE);
        clone.setClonedFromId(source.getId());
        // fileHash/perceptualHash intentionally left null. Disk contents will be
        // identical right after the copy, but the user will replace the file with
        // the actual U2 PDF — at that point hashing will recompute. Leaving them
        // null avoids duplicate-detection false positives on the freshly cloned row.
        clone.buildFileLink();
        clone.buildFolder();
        return clone;
    }

    /**
     * Field-by-field equipment clone. Mirrors the pattern in
     * {@code EquipmentServiceImpl.copyEqFromAnotherUnit}, but routes LOTO point
     * resolution through the caller (suggestions vs auto-link) instead of
     * silently saving via {@code lotoPointMergeService}.
     *
     * <p>Skipped intentionally:
     * <ul>
     *   <li>{@code highlight} — legacy FK with {@code cascade=ALL}; sharing
     *       across two Equipment rows is a delete-cascade trap.</li>
     *   <li>{@code files}, {@code heatTraceList}, {@code breakers} — cross-refs
     *       or inverse collections; copying would alias unrelated entities.</li>
     *   <li>{@code conflictStatus}, {@code conflictId}, {@code isVerified} —
     *       per-row review state; clone starts fresh.</li>
     * </ul>
     */
    private Equipment cloneEquipment(Equipment src, FileObject newMainFile, String fromUnit, String toUnit) {
        Equipment eq = new Equipment();
        eq.setName(transformText(src.getName(), fromUnit, toUnit));
        eq.setTagNumber(transformText(src.getTagNumber(), fromUnit, toUnit));
        eq.setDescription(transformText(src.getDescription(), fromUnit, toUnit));
        eq.setSpecificLocation(transformText(src.getSpecificLocation(), fromUnit, toUnit));
        eq.setCoordinates(src.getCoordinates());
        eq.setOriginalPictureSize(src.getOriginalPictureSize());
        eq.setRotation(src.getRotation());
        eq.setSymbolId(src.getSymbolId());
        eq.setSvgPath(src.getSvgPath());
        eq.setSeparationNote(src.getSeparationNote());
        eq.setEqType(src.getEqType());
        eq.setVendor(src.getVendor());
        eq.setLocation(src.getLocation());
        eq.setSystem(src.getSystem());
        eq.setMainFile(newMainFile);
        eq.setLotoPoints(new HashSet<>());
        eq.setIsVerified(Boolean.FALSE);
        return eq;
    }

    // ------------------------------------------------------------------------
    // LOTO point resolution
    // ------------------------------------------------------------------------

    /** Mutable bag returned by {@link #resolveLotoPointsForEquipment}. */
    private static final class EqLotoResolution {
        int autoLinked = 0;
        int reused = 0;
        final List<LotoSuggestionDto> suggestions = new ArrayList<>();
    }

    /**
     * For each LOTO point on the source equipment, decide how the new equipment
     * should reference it:
     * <ul>
     *   <li>tag doesn't follow 01/02 convention → REUSE same LotoPoint
     *       (not unit-specific — shared, e.g. equipment without a unit-specific tag).</li>
     *   <li>real counterpart exists in DB (via FK or tag-swap search) → ATTACH it
     *       to the new equipment AND set bidirectional counterpartId if not
     *       already linked.</li>
     *   <li>no DB match (only suggested/transient) → SKIP attaching; surface a
     *       {@link LotoSuggestionDto} so the user can review and accept later.</li>
     * </ul>
     */
    private EqLotoResolution resolveLotoPointsForEquipment(Equipment srcEq, Equipment newEq) {
        EqLotoResolution out = new EqLotoResolution();
        if (srcEq.getLotoPoints() == null || srcEq.getLotoPoints().isEmpty()) return out;

        boolean attached = false;
        for (LotoPoint lp : srcEq.getLotoPoints()) {
            String tag = lp.getTagNumber();
            if (tag == null || (!tag.startsWith("01") && !tag.startsWith("02"))) {
                // Shared, non-unit-specific point — reuse on the new equipment.
                newEq.addLotoPoint(lp);
                out.reused++;
                attached = true;
                continue;
            }

            Map<String, Object> cp = ngLotoPointService.findUnitCounterpart(lp.getId());
            if (cp == null) continue; // Defensive — shouldn't happen given the prefix check above.

            Object dtoObj = cp.get("counterpart");
            Boolean isNew = (Boolean) cp.get("isNew");
            Boolean isLinked = (Boolean) cp.get("isLinked");
            if (Boolean.TRUE.equals(isNew) || !(dtoObj instanceof LotoPointDto cpDto) || cpDto.getId() == null) {
                // No real DB row — emit a suggestion (the transient suggested DTO
                // already has tag/desc swapped + unit text transformed).
                if (dtoObj instanceof LotoPointDto suggested) {
                    out.suggestions.add(new LotoSuggestionDto(newEq.getId(), lp.getId(), suggested));
                }
                continue;
            }

            // Real counterpart row found — attach it.
            LotoPoint cpEntity = lotoPointService.findById(cpDto.getId()).orElse(null);
            if (cpEntity == null) continue;
            newEq.addLotoPoint(cpEntity);
            attached = true;
            out.autoLinked++;

            // Establish bidirectional FK if it wasn't already linked.
            if (!Boolean.TRUE.equals(isLinked)) {
                try {
                    ngLotoPointService.linkCounterparts(lp.getId(), cpEntity.getId());
                } catch (RuntimeException ex) {
                    log.warn("clone-to-unit: linkCounterparts({},{}) failed: {}", lp.getId(), cpEntity.getId(), ex.getMessage());
                }
            }
        }

        if (attached) equipmentService.save(newEq);
        return out;
    }

    // ------------------------------------------------------------------------
    // Disk file copy
    // ------------------------------------------------------------------------

    /**
     * Copies each extension's source file to its target path. Returns the count
     * of files actually copied (missing sources are logged but don't fail the
     * clone — they may have been deleted out-of-band).
     */
    private int copyDiskFiles(FileObject source, FileObject clone) {
        int copied = 0;
        List<String> exts = source.getExtensionsArray();
        if (exts.isEmpty() && source.getExtension() != null) exts = List.of(source.getExtension());
        for (String ext : exts) {
            String srcRel = source.buildRelativePath(ext);
            String dstRel = clone.buildRelativePath(ext);
            if (srcRel == null || dstRel == null) continue;
            Path src = Paths.get(filesRootPath, srcRel);
            Path dst = Paths.get(filesRootPath, dstRel);
            if (!Files.exists(src)) {
                log.warn("clone-to-unit: source disk file missing — skipping: {}", src);
                continue;
            }
            try {
                Files.createDirectories(dst.getParent());
                Files.copy(src, dst, StandardCopyOption.REPLACE_EXISTING);
                copied++;
                log.info("clone-to-unit: copied {} -> {}", src, dst);
            } catch (IOException ex) {
                // Throw to roll back the FileObject save — leaving a DB row that points
                // at a non-existent disk file would be a worse outcome than failing now.
                throw new RuntimeException("clone-to-unit: disk copy failed " + src + " -> " + dst + ": " + ex.getMessage(), ex);
            }
        }
        return copied;
    }

    // ------------------------------------------------------------------------
    // Text transformation
    // ------------------------------------------------------------------------

    /**
     * Mirrors {@code NgLotoPointService.processDescription} but case-insensitive
     * for the U/Unit prefix, so all-caps file names ("UNIT 1 ESSENTIAL SERVICE
     * BUS TCP") transform too. Pass 1 swaps leading "01"/"02" tokens; Pass 2
     * uses a regex with a captured case-preserving prefix so "UNIT 1" becomes
     * "UNIT 2" (not "Unit 2"), "Unit 1" stays "Unit 2", "U1" stays "U2".
     *
     * <p>{@code (?<![A-Za-z])} prevents matching inside larger words (BUSU1 → not touched);
     * {@code (?!\d)} prevents matching different-unit numbers like "U10".
     */
    private String transformText(String text, String fromUnit, String toUnit) {
        if (text == null) return null;
        char fromDigit = fromUnit.charAt(1);
        char toDigit = toUnit.charAt(1);

        // Pass 1: swap leading "01"/"02" tokens in space-separated parts (case-irrelevant — digits).
        String result = Arrays.stream(text.split(" "))
                .map(part -> part.startsWith(fromUnit) ? toUnit + part.substring(2) : part)
                .collect(Collectors.joining(" "));

        // Pass 2: case-insensitive U/Unit + digit swap, preserving captured case.
        Pattern p = Pattern.compile(
            "(?<![A-Za-z])(unit ?|u)" + fromDigit + "(?!\\d)",
            Pattern.CASE_INSENSITIVE
        );
        Matcher m = p.matcher(result);
        StringBuffer sb = new StringBuffer();
        while (m.find()) {
            m.appendReplacement(sb, Matcher.quoteReplacement(m.group(1) + toDigit));
        }
        m.appendTail(sb);
        return sb.toString();
    }

    private String other(String unit) {
        return "01".equals(unit) ? "02" : "01";
    }

    // ------------------------------------------------------------------------
    // File-number disambiguation
    // ------------------------------------------------------------------------

    /**
     * Compute the target file number. Tries the unit-swap transform first; falls
     * back to a "-U{N}" suffix if the transform didn't change anything (file
     * number had no unit marker). Then appends "-2", "-3"… until the result
     * doesn't collide with an existing FileObject — supports re-cloning when
     * the user accepts {@code force=true} with a prior clone present.
     */
    private String computeUniqueTargetFileNumber(FileObject source, String sourceUnit, String targetUnit) {
        String srcNum = source.getFileNumber() == null ? "" : source.getFileNumber();
        String transformed = transformText(srcNum, sourceUnit, targetUnit);
        if (transformed.equals(srcNum)) {
            transformed = srcNum + "-U" + targetUnit.charAt(1);
        }
        String candidate = transformed;
        int suffix = 2;
        while (fileRepo.findFirstByFileNumberOrderByIdAsc(candidate) != null) {
            candidate = transformed + "-" + suffix++;
            if (suffix > 50) {
                throw new RuntimeException("clone-to-unit: could not allocate unique fileNumber after 50 tries (base=" + transformed + ")");
            }
        }
        return candidate;
    }

    // ------------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------------

    private CloneFileResultDto error(Long sourceFileId, String msg) {
        log.warn("clone-to-unit: {}", msg);
        return new CloneFileResultDto("error", sourceFileId, null, List.of(), null, null, null, List.of(), msg);
    }

    // ------------------------------------------------------------------------
    // Backfill — for clones created BEFORE counterpartId field existed
    // ------------------------------------------------------------------------

    /**
     * One-shot repair for clones made before the {@code counterpartId} field was
     * added. Walks every FileObject with {@code clonedFromId} set:
     * <ul>
     *   <li>If the clone has no counterpartId, point it at its parent ({@code clonedFromId}).</li>
     *   <li>If the parent has no counterpartId, point it at this clone.</li>
     * </ul>
     * Idempotent — re-running is safe. Parents that already have a counterpart
     * (e.g. multiple clones via force=true) keep their existing pointer; only
     * the clone side is freshly populated. Returns counts of what changed.
     */
    public BackfillCounterpartResult backfillCounterparts() {
        int clonesFixed = 0;
        int parentsFixed = 0;
        int skipped = 0;
        for (FileObject clone : fileRepo.findAllClones()) {
            boolean changed = false;
            Long parentId = clone.getClonedFromId();
            if (parentId == null) { skipped++; continue; }

            if (clone.getCounterpartId() == null) {
                clone.setCounterpartId(parentId);
                changed = true;
                clonesFixed++;
            }

            FileObject parent = fileRepo.findById(parentId).orElse(null);
            if (parent != null && parent.getCounterpartId() == null) {
                parent.setCounterpartId(clone.getId());
                fileRepo.saveAndFlush(parent);
                parentsFixed++;
            }

            if (changed) fileRepo.saveAndFlush(clone);
        }
        log.info("clone-counterpart backfill: clones={} parents={} skipped={}",
            clonesFixed, parentsFixed, skipped);
        return new BackfillCounterpartResult(clonesFixed, parentsFixed, skipped);
    }

    public record BackfillCounterpartResult(int clonesFixed, int parentsFixed, int skipped) {}

    // ========================================================================
    // Expanded counterpart functionality
    //   - link/unlink (manually set counterpart between two existing files)
    //   - findCounterpartCandidates (smart suggestions for the picker UI)
    //   - importFromCounterpart (copy equipment+loto from linked counterpart)
    // ========================================================================

    /**
     * Manually link two existing FileObjects as counterparts of each other.
     * Bidirectional — same pattern as the cloneToUnit success path. If either
     * file currently has a DIFFERENT counterpart set, the old link is broken
     * (the orphaned file's counterpartId still points at one of these two —
     * acceptable for now; user can re-link if needed).
     */
    public void linkCounterparts(Long fileAId, Long fileBId) {
        if (fileAId == null || fileBId == null || fileAId.equals(fileBId)) {
            throw new RuntimeException("link-counterpart: both ids required and must differ");
        }
        FileObject a = fileRepo.findById(fileAId).orElseThrow(
            () -> new RuntimeException("File not found: " + fileAId));
        FileObject b = fileRepo.findById(fileBId).orElseThrow(
            () -> new RuntimeException("File not found: " + fileBId));
        a.setCounterpartId(b.getId());
        b.setCounterpartId(a.getId());
        fileRepo.saveAndFlush(a);
        fileRepo.saveAndFlush(b);
        log.info("link-counterpart: linked #{} ↔ #{}", a.getId(), b.getId());
    }

    /**
     * Clear the counterpart pointer on this file AND its current counterpart
     * (bidirectional unlink). No-op if the file has no counterpart set.
     */
    public void unlinkCounterpart(Long fileId) {
        FileObject f = fileRepo.findById(fileId).orElseThrow(
            () -> new RuntimeException("File not found: " + fileId));
        Long otherId = f.getCounterpartId();
        f.setCounterpartId(null);
        fileRepo.saveAndFlush(f);
        if (otherId != null) {
            fileRepo.findById(otherId).ifPresent(other -> {
                // Only clear other's pointer if it still points back at us — don't
                // stomp a different active link on the other side.
                if (fileId.equals(other.getCounterpartId())) {
                    other.setCounterpartId(null);
                    fileRepo.saveAndFlush(other);
                }
            });
        }
        log.info("unlink-counterpart: cleared file #{} (was paired with #{})", fileId, otherId);
    }

    /**
     * Rank candidate files for the "Set Counterpart File…" picker.
     * Scoring (additive):
     * <ul>
     *   <li>Same fileType: +30, same vendor: +20, same system: +10 (baseline match)</li>
     *   <li>Perfect U1↔U2 / 01↔02 swap of the file number: +100 (top priority)</li>
     *   <li>1-character edit distance: +50, 2-char: +25 (catches the A↔B / extra-letter pattern)</li>
     * </ul>
     * Returns top {@code limit} non-self entries with score > 30, sorted desc.
     */
    public List<CounterpartCandidateDto> findCounterpartCandidates(Long fileId, int limit) {
        FileObject src = fileRepo.findById(fileId).orElseThrow(
            () -> new RuntimeException("File not found: " + fileId));

        String srcUnit = inferUnitFromText(src.getFileNumber());
        String swapUnit = srcUnit == null ? null : (srcUnit.equals("01") ? "02" : "01");
        String swapTarget = (srcUnit != null && src.getFileNumber() != null)
            ? transformText(src.getFileNumber(), srcUnit, swapUnit)
            : null;

        // Narrow the search space to the same fileType when possible — otherwise the
        // scorer has to iterate every file in the DB, which is wasteful for big libraries.
        List<FileObject> pool = src.getFileType() != null
            ? fileRepo.findByFileType(src.getFileType())
            : fileRepo.findAll();

        return pool.stream()
            .filter(f -> !f.getId().equals(fileId))
            .map(f -> scoreCandidate(src, f, swapTarget))
            .filter(c -> c.score() > 30)
            .sorted((a, b) -> Integer.compare(b.score(), a.score()))
            .limit(limit)
            .toList();
    }

    private CounterpartCandidateDto scoreCandidate(FileObject src, FileObject other, String swapTarget) {
        int score = 0;
        List<String> reasons = new ArrayList<>();

        if (sameValueId(src.getFileType(), other.getFileType())) score += 30;
        if (sameValueId(src.getVendor(), other.getVendor())) { score += 20; reasons.add("same vendor"); }
        if (sameValueId(src.getSystem(), other.getSystem())) { score += 10; reasons.add("same system"); }

        String srcNum = src.getFileNumber() == null ? "" : src.getFileNumber();
        String otherNum = other.getFileNumber() == null ? "" : other.getFileNumber();

        if (swapTarget != null && !swapTarget.isEmpty() && swapTarget.equalsIgnoreCase(otherNum)) {
            score += 100;
            reasons.add(0, "tag-swap (U1↔U2)");
        } else if (!srcNum.isEmpty() && !otherNum.isEmpty()) {
            int dist = levenshtein(srcNum.toLowerCase(), otherNum.toLowerCase());
            if (dist == 1) { score += 50; reasons.add(0, "1-letter difference"); }
            else if (dist == 2) { score += 25; reasons.add(0, "2-letter difference"); }
        }

        // Name token overlap — catches counterparts whose file numbers diverge
        // but whose names share most words. Example pair the file-number
        // scoring misses: "HP Steam Header (HRSG)" ↔ "HP Steam Header (ST)".
        int nameOverlap = nameTokenOverlap(src.getName(), other.getName());
        if (nameOverlap >= 3) { score += 40; reasons.add("similar name"); }
        else if (nameOverlap == 2) { score += 20; reasons.add("similar name"); }
        else if (nameOverlap == 1) { score += 5; /* weak signal — no reason badge */ }

        return new CounterpartCandidateDto(
            other.getId(),
            otherNum,
            other.getName(),
            other.getFileType() != null ? other.getFileType().getName() : null,
            other.getVendor() != null ? other.getVendor().getName() : null,
            score,
            reasons.isEmpty() ? "Same file type" : String.join(", ", reasons)
        );
    }

    /**
     * Count how many ≥3-character word tokens two names share (case-insensitive,
     * non-word chars treated as separators). 3+ chars filters out filler like
     * "of"/"the" so they don't inflate the overlap. Returns 0 when either name
     * is null/blank.
     */
    private int nameTokenOverlap(String a, String b) {
        if (a == null || b == null) return 0;
        Set<String> tokensA = tokenize(a);
        if (tokensA.isEmpty()) return 0;
        Set<String> tokensB = tokenize(b);
        int overlap = 0;
        for (String t : tokensA) if (tokensB.contains(t)) overlap++;
        return overlap;
    }

    private Set<String> tokenize(String s) {
        return Arrays.stream(s.toLowerCase().split("[\\s\\W_]+"))
            .filter(t -> t.length() >= 3)
            .collect(java.util.stream.Collectors.toSet());
    }

    private boolean sameValueId(com.dk_power.power_plant_java.entities.categories.Value a,
                                 com.dk_power.power_plant_java.entities.categories.Value b) {
        if (a == null || b == null) return false;
        return a.getId() != null && a.getId().equals(b.getId());
    }

    /** Iterative Levenshtein with two rolling rows — O(min(m,n)) memory. */
    private int levenshtein(String a, String b) {
        if (a.equals(b)) return 0;
        if (a.isEmpty()) return b.length();
        if (b.isEmpty()) return a.length();
        int[] prev = new int[b.length() + 1];
        int[] curr = new int[b.length() + 1];
        for (int j = 0; j <= b.length(); j++) prev[j] = j;
        for (int i = 1; i <= a.length(); i++) {
            curr[0] = i;
            for (int j = 1; j <= b.length(); j++) {
                int cost = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1;
                curr[j] = Math.min(Math.min(curr[j - 1] + 1, prev[j] + 1), prev[j - 1] + cost);
            }
            int[] tmp = prev; prev = curr; curr = tmp;
        }
        return prev[b.length()];
    }

    /**
     * Copy equipment + LOTO from this file's already-linked counterpart into
     * this file. Optionally soft-deletes existing equipment on the target
     * first (so the import is a clean replace rather than an additive merge).
     *
     * <p>Unit detection: prefers the target's own equipment/file-number unit
     * hints; falls back to source's swap. If neither side gives a clear unit,
     * skips the text transform and copies field values as-is.
     */
    public ImportFromCounterpartResultDto importFromCounterpart(Long targetFileId, boolean keepExisting) {
        FileObject target = fileRepo.findById(targetFileId).orElse(null);
        if (target == null) {
            return importError(targetFileId, "Target file " + targetFileId + " not found");
        }
        Long sourceId = target.getCounterpartId();
        if (sourceId == null) {
            return importError(targetFileId, "Target file has no counterpart linked — use 'Set Counterpart File' first");
        }
        FileObject source = fileRepo.findById(sourceId).orElse(null);
        if (source == null) {
            return importError(targetFileId, "Linked counterpart file #" + sourceId + " not found (broken link)");
        }

        // Detect units. Target-first so we transform TO its convention; fall back
        // to source-then-swap. If neither is unit-tagged, pass-through (transformText
        // would just no-op on text without unit markers).
        String targetUnit = detectSourceUnit(target);
        String sourceUnit = detectSourceUnit(source);
        if (targetUnit == null && sourceUnit != null) {
            targetUnit = sourceUnit.equals("01") ? "02" : "01";
        }
        if (sourceUnit == null && targetUnit != null) {
            sourceUnit = targetUnit.equals("01") ? "02" : "01";
        }
        if (sourceUnit == null) { sourceUnit = "01"; targetUnit = "02"; } // arbitrary — no transform will fire on text without markers

        int deleted = 0;
        if (!keepExisting) {
            List<Equipment> existing = equipmentRepo.findByMainFile_Id(targetFileId);
            for (Equipment e : existing) {
                e.setDeleted(true);
                equipmentService.save(e);
                deleted++;
            }
            log.info("import-from-counterpart: soft-deleted {} existing equipment on file #{}", deleted, targetFileId);
        }

        EquipmentImportResult eqResult = cloneEquipmentAndLotoFrom(source, target, sourceUnit, targetUnit);

        CloneSummaryDto summary = new CloneSummaryDto(
            eqResult.equipmentCount, eqResult.autoLinked, eqResult.suggestions.size(),
            eqResult.reused, 0  // no disk copy in this flow
        );
        return new ImportFromCounterpartResultDto(
            "created", targetFileId, sourceId, deleted, sourceUnit, targetUnit,
            summary, eqResult.suggestions, null
        );
    }

    private ImportFromCounterpartResultDto importError(Long targetFileId, String msg) {
        log.warn("import-from-counterpart: {}", msg);
        return new ImportFromCounterpartResultDto(
            "error", targetFileId, null, 0, null, null, null, List.of(), msg);
    }
}
