package com.dk_power.power_plant_java.controller.angular.qr;

import com.dk_power.power_plant_java.config.security.RestrictedAllowed;
import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointDto;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.repository.equipment.EquipmentRepo;
import com.dk_power.power_plant_java.repository.file.FileRepo;
import com.dk_power.power_plant_java.repository.loto.LotoPointRepo;
import com.dk_power.power_plant_java.sevice.angular.NgEquipmentService;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoPointService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * QR scan resolver. A scanned QR encodes a tag number that could belong to
 * a LotoPoint OR an Equipment (they're the same string in most cases but not
 * always). Search order per user request:
 * <ol>
 *   <li>All active LotoPoints with matching tag (primary — LOTO is the domain
 *       focus for QR labels).</li>
 *   <li>All active Equipment with matching tag (secondary — covers labels
 *       printed for equipment that isn't tied to a LotoPoint).</li>
 * </ol>
 * All matches are returned so the operator can browse when there are
 * duplicates or when both a LotoPoint and Equipment share the tag.
 */
@RestController
@RequestMapping("/ng/qr")
@RequiredArgsConstructor
@Slf4j
@RestrictedAllowed
public class NgQrController {

    private final EquipmentRepo equipmentRepo;
    private final LotoPointRepo lotoPointRepo;
    private final FileRepo fileRepo;
    private final NgEquipmentService ngEquipmentService;
    private final NgLotoPointService ngLotoPointService;

    /**
     * Multi-type tag resolver.
     *
     * <p><b>Path preserved for backward compat with printed QRs.</b>
     * Physical labels already in the field encode {@code /qr/{tag}} which the
     * hub redirects to {@code /app/qr/equipment/{tag}} — that Angular route
     * hits this endpoint. Renaming the URL would invalidate every printed
     * label, so we keep the "equipment" segment as a legacy artifact even
     * though we now search LotoPoints first.
     *
     * <p><b>Why @Transactional(readOnly = true):</b> {@code spring.jpa.open-in-view=false}
     * is set on both desktop and hub profiles, so the Hibernate session
     * closes when the repository call returns. The reflective ModelMapper
     * inside toDto walks lazy collections (Equipment.files, LotoPoint.equipmentList,
     * etc.) — without a read-only tx wrapping the whole request, those trigger
     * {@code LazyInitializationException}. Confirmed cause of prior "Failed to
     * load equipment data" errors in production logs.
     *
     * @return {@code { matches: [{ type, id, tagNumber, ... }] }} — full details
     * for every hit. Empty response body with 404 status when nothing matches.
     */
    @Transactional(readOnly = true)
    @GetMapping("/equipment/{tagNumber}")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> resolveTag(
            @PathVariable String tagNumber) {
        try {
            List<LotoPoint> lotoPointMatches = lotoPointRepo.findAllActiveByTagNumberIgnoreCase(tagNumber);
            List<Equipment> equipmentMatches = equipmentRepo.findAllActiveByTagNumberIgnoreCase(tagNumber);

            if (lotoPointMatches.isEmpty() && equipmentMatches.isEmpty()) {
                log.info("[QR] Tag lookup: tagNumber={}, matches=0", tagNumber);
                return ResponseEntity.notFound().build();
            }

            List<Map<String, Object>> matches = new ArrayList<>();

            // LotoPoints first — that's the primary intent of the QR system.
            for (LotoPoint lp : lotoPointMatches) {
                matches.add(buildLotoPointMatch(lp));
            }

            // Equipment matches for tags that aren't attached to a LotoPoint
            // (or where the operator printed an equipment-first label).
            for (Equipment eq : equipmentMatches) {
                matches.add(buildEquipmentMatch(eq));
            }

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("matches", matches);
            result.put("lotoPointCount", lotoPointMatches.size());
            result.put("equipmentCount", equipmentMatches.size());

            log.info("[QR] Tag lookup: tagNumber={}, lotoPoints={}, equipment={}",
                    tagNumber, lotoPointMatches.size(), equipmentMatches.size());
            return ResponseEntity.ok(new NgApiResponse<>(result, "Matches found"));
        } catch (Exception e) {
            log.error("[QR] Tag lookup failed: tagNumber={}, error={}", tagNumber, e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Lookup failed: " + e.getMessage()));
        }
    }

    /**
     * Package a LotoPoint match with everything the viewer needs.
     * <p>
     * The LotoPoint doesn't own a P&ID directly — it references one via its
     * associated Equipment (ManyToMany equipmentList). We pick the first
     * associated Equipment that has a mainFile as the "drawing target" and
     * return the equipment-on-P&ID list keyed to that file. Highlighting on
     * the drawing points at the chosen Equipment's id (that's what the shape
     * overlays are keyed by; LotoPoint has no shape of its own).
     * <p>
     * {@code incompleteReason} tells the frontend how to render:
     *  - {@code null}: full drawing view with highlight,
     *  - {@code "no-equipment"}: LotoPoint has no equipment; show details only,
     *  - {@code "no-drawing"}: has equipment but none with a mainFile.
     */
    private Map<String, Object> buildLotoPointMatch(LotoPoint lp) {
        Map<String, Object> match = new LinkedHashMap<>();
        match.put("type", "lotoPoint");
        match.put("id", lp.getId());
        match.put("tagNumber", lp.getTagNumber());
        match.put("description", lp.getDescription());

        LotoPointDto lpDto = ngLotoPointService.toDto(lp);
        match.put("target", lpDto);

        Equipment drawingEquipment = null;
        if (lp.getEquipmentList() != null) {
            for (Equipment eq : lp.getEquipmentList()) {
                if (eq.getMainFile() != null) {
                    drawingEquipment = eq;
                    break;
                }
            }
        }

        if (drawingEquipment == null) {
            match.put("equipmentOnPid", List.of());
            match.put("targetEquipmentId", null);
            String reason = (lp.getEquipmentList() == null || lp.getEquipmentList().isEmpty())
                    ? "no-equipment"
                    : "no-drawing";
            match.put("incompleteReason", reason);
            match.put("hasDrawing", false);
        } else {
            FileObject drawingFile = drawingEquipment.getMainFile();
            List<EquipmentDto> onPid = equipmentRepo.findByMainFile_Id(drawingFile.getId()).stream()
                    .map(ngEquipmentService::toDto)
                    .toList();
            match.put("equipmentOnPid", onPid);
            match.put("targetEquipmentId", drawingEquipment.getId());
            match.put("incompleteReason", null);
            match.put("hasDrawing", true);
        }
        return match;
    }

    /**
     * Browse a P&ID directly by file id — no tag lookup, no highlight.
     * <p>
     * Entry point for connector-driven navigation: when the QR viewer renders
     * a file-connector shape and the user taps it, the frontend calls this
     * endpoint with {@code targetFileId} to swap the active drawing to the
     * referenced file. Response mirrors the {@link #buildEquipmentMatch}
     * shape so the frontend can drop the result into its {@code activeMatch}
     * signal without a second code path — {@code type} is set to
     * {@code "file"} to distinguish it from a tag hit.
     * <p>
     * {@code targetEquipmentId} is intentionally null: the user arrived via
     * a connector, not a specific equipment, so nothing on the drawing gets
     * a highlight ring. All equipment on the file are still returned so the
     * viewer renders their click-through shapes.
     */
    @Transactional(readOnly = true)
    @GetMapping("/file/{fileId}")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> browseFile(
            @PathVariable Long fileId) {
        try {
            FileObject file = fileRepo.findById(fileId).orElse(null);
            if (file == null) {
                log.info("[QR] File browse: fileId={}, not found", fileId);
                return ResponseEntity.notFound().build();
            }

            List<EquipmentDto> onPid = equipmentRepo.findByMainFile_Id(fileId).stream()
                    .map(ngEquipmentService::toDto)
                    .toList();

            Map<String, Object> match = new LinkedHashMap<>();
            match.put("type", "file");
            match.put("id", file.getId());
            match.put("tagNumber", file.getFileNumber() != null ? file.getFileNumber() : file.getName());
            match.put("description", file.getName());
            // No entity target — frontend renders "browse" mode when type=='file'.
            match.put("target", null);
            match.put("equipmentOnPid", onPid);
            match.put("targetEquipmentId", null);
            match.put("hasDrawing", true);
            match.put("incompleteReason", null);

            log.info("[QR] File browse: fileId={}, equipment={}", fileId, onPid.size());
            return ResponseEntity.ok(new NgApiResponse<>(match, "File loaded"));
        } catch (Exception e) {
            log.error("[QR] File browse failed: fileId={}, error={}", fileId, e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Browse failed: " + e.getMessage()));
        }
    }

    /**
     * Package an Equipment match. Highlighting is on the equipment itself,
     * P&ID is its mainFile, incomplete only when there's no mainFile.
     */
    private Map<String, Object> buildEquipmentMatch(Equipment eq) {
        Map<String, Object> match = new LinkedHashMap<>();
        match.put("type", "equipment");
        match.put("id", eq.getId());
        match.put("tagNumber", eq.getTagNumber());
        match.put("description", eq.getDescription());

        EquipmentDto eqDto = ngEquipmentService.toDto(eq);
        match.put("target", eqDto);

        if (eq.getMainFile() == null) {
            match.put("equipmentOnPid", List.of());
            match.put("targetEquipmentId", null);
            match.put("incompleteReason", "no-drawing");
            match.put("hasDrawing", false);
        } else {
            List<EquipmentDto> onPid = equipmentRepo.findByMainFile_Id(eq.getMainFile().getId()).stream()
                    .map(ngEquipmentService::toDto)
                    .toList();
            match.put("equipmentOnPid", onPid);
            match.put("targetEquipmentId", eq.getId());
            match.put("incompleteReason", null);
            match.put("hasDrawing", true);
        }
        return match;
    }
}
