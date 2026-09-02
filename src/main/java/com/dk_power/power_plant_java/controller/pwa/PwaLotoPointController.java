package com.dk_power.power_plant_java.controller.pwa;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.base_dtos.CommentDto;
import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointDto;
import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointIdDto;
import com.dk_power.power_plant_java.dto.permits.loto_standard.PointDrawingDto;
import com.dk_power.power_plant_java.dto.permits.loto_standard.WalkdownSubmitRequest;
import com.dk_power.power_plant_java.entities.base_entities.Comment;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.repository.file.FileRepo;
import com.dk_power.power_plant_java.repository.loto.LotoPointRepo;
import com.dk_power.power_plant_java.sevice.angular.NgCommentService;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoPointService;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoStandardService;
import com.dk_power.power_plant_java.sevice.pwa.PwaLotoDrawingService;
import com.dk_power.power_plant_java.sevice.pwa.PwaLotoStandardWalkdownService;

import java.util.stream.Collectors;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

/**
 * Mobile (PWA) LOTO Point actions: attach photos and post comments to a
 * point without leaving the LOTO Standard flow. Both write into the same
 * underlying storage the desktop uses — {@code loto_point_picture} M2M for
 * photos and the generic polymorphic {@code Comment} table
 * (entityType="LotoPoint") for comments — so PWA-uploaded evidence is
 * visible on the desktop LOTO Point form's Pictures / Comments cell
 * without an extra sync step.
 *
 * <p>Auth mirrors {@link PwaLotoStandardController}: lives under
 * {@code /api/pwa/secured/**} so PwaJwtAuthFilter validates the JWT, and
 * ROLE_PLANT/ROLE_ADMIN is enforced by SecurityConfig at that path.
 * Author attribution on comments comes from the JWT-set principal (via
 * Spring Data auditing's {@code @CreatedBy} on {@link Comment}'s base
 * class).
 */
@RestController
@RequestMapping("/api/pwa/secured/loto-points")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(
        originPatterns = {
                "https://dk-power.github.io",
                "https://jacksongeneration.github.io",
                "http://localhost:*",
                "http://127.0.0.1:*"
        },
        allowCredentials = "true")
public class PwaLotoPointController {

    private static final String LOTO_POINT_ENTITY_TYPE = "LotoPoint";
    /** Adversarial-review-driven cap. Comments longer than this go through the
     * regular file/attachment flow, not the polymorphic Comment table. Matches
     * the practical limit for a mobile-typed operator note. */
    private static final int MAX_COMMENT_CONTENT_LENGTH = 10_000;

    private final NgLotoPointService lotoPointService;
    private final NgCommentService commentService;
    private final FileRepo fileRepo;
    private final PwaLotoStandardWalkdownService walkdownService;
    private final PwaLotoDrawingService drawingService;
    private final LotoPointRepo lotoPointRepo;
    private final NgLotoStandardService lotoStandardService;

    /**
     * Absolute path to the on-disk uploads root, mirrored from
     * {@code NgFileService}. The PWA photo-bytes endpoint below resolves each
     * FileObject's stored relative link against this so we don't have to
     * expose the raw static {@code /uploads/**} URL to the client (which is
     * behind IIS auth and would 401 in the PWA context).
     */
    @Value("${files.root.path}")
    private String filesRootPath;

    /** Used by {@link #getPhotoContent} to run a lightweight COUNT on the loto_point_picture
     *  join table without triggering a full M2M lazy load (which would blow up outside a
     *  managed session and turn a legit "not attached" into a 500). */
    @PersistenceContext
    private EntityManager entityManager;

    // ── Point creation + tag existence check + edit ──────────────────────────

    /**
     * Return every LOTO point whose tag exactly matches {@code tag} — case-sensitive, exactly as
     * stored. The PWA creation flow calls this before showing the "fill in the rest" form so the
     * walker can spot an already-existing point and pick it up instead of creating a duplicate.
     * Empty list is a legitimate "tag is free" answer.
     */
    @GetMapping("/by-tag")
    public ResponseEntity<NgApiResponse<List<LotoPointDto>>> findByTag(@RequestParam String tag) {
        try {
            if (tag == null || tag.isBlank()) {
                return ResponseEntity.ok(new NgApiResponse<>(List.of(), "Empty tag"));
            }
            List<LotoPointDto> matches = lotoPointRepo.findByTagNumber(tag.trim()).stream()
                    .filter(p -> !Boolean.TRUE.equals(p.getDeleted()))
                    .map(lotoPointService::toDto)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(new NgApiResponse<>(matches, "OK"));
        } catch (Exception e) {
            log.error("PWA findByTag failed for tag='{}'", tag, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new NgApiResponse<>(List.of(), "Failed to look up tag: " + e.getMessage()));
        }
    }

    /**
     * Create OR update a LOTO point (id-driven: id absent/zero → CREATE, id present → UPDATE).
     * Delegates to the same {@code processLotoPointToDto} the desktop /ng/loto-points POST calls,
     * which resolves Value FKs (isoPos/normPos/location/eqType/systemValue/vendor), equipment
     * links, and zero-energy — a full round-trip through the desktop CRUD path.
     *
     * <p>Optional {@code addToStandardId} query parameter — when supplied AND the point ends up
     * with a real id, wire it onto that standard in the same request. Convenience for the "add
     * new point to standard from the PWA" flow.
     */
    @PostMapping
    public ResponseEntity<NgApiResponse<LotoPointDto>> createOrUpdatePoint(
            @RequestBody LotoPointIdDto lotoPoint,
            @RequestParam(required = false) Long addToStandardId) {
        try {
            LotoPointDto saved = lotoPointService.processLotoPointToDto(lotoPoint);
            if (addToStandardId != null && saved != null && saved.getId() != null) {
                lotoStandardService.addLotoPointToStandard(saved.getId(), String.valueOf(addToStandardId));
                // Re-fetch so the response reflects the standard linkage.
                saved = lotoPointService.findDtoById(saved.getId()).orElse(saved);
            }
            return ResponseEntity.ok(new NgApiResponse<>(saved, "LOTO point saved"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        } catch (Exception e) {
            log.error("PWA createOrUpdatePoint failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new NgApiResponse<>(null, "Failed to save point: " + e.getMessage()));
        }
    }

    // ── Points-pile walkdown ────────────────────────────────────────────────

    /**
     * Return a de-duplicated pile of LOTO points matching a combination of the desktop's most
     * common table filters. Every param is optional — supplying none is a 400 (would otherwise
     * dump every point in the plant). Provided params AND together; the multi-value ones (
     * {@code locationIds}, {@code eqTypeIds}, {@code systems}) OR their contents inside the AND.
     *
     * <ul>
     *   <li>{@code standardIds}    — union of every point on the given LOTO standards (seed set)</li>
     *   <li>{@code locationIds}    — points whose {@code location} Value FK id is IN the list</li>
     *   <li>{@code eqTypeIds}      — points whose {@code eqType} Value FK id is IN the list</li>
     *   <li>{@code systems}        — points whose {@code system} (case-insensitive) is IN the list</li>
     *   <li>{@code isoPosId}       — {@code isoPos} Value FK id match (single)</li>
     *   <li>{@code normPosId}      — {@code normPos} Value FK id match (single)</li>
     *   <li>{@code unit}           — exact match on the free-text unit column</li>
     *   <li>{@code tagNumber}      — contains-match on tagNumber (case-insensitive)</li>
     *   <li>{@code description}    — contains-match on description (case-insensitive)</li>
     *   <li>{@code specificLocation} — contains-match on specificLocation (case-insensitive)</li>
     * </ul>
     * Response is a fat {@link LotoPointDto}. All filtering + FK loading happens in ONE JPQL
     * query with FETCH JOINs, so the previous 20-second in-memory scan / timeout is gone.
     */
    @GetMapping("/walkdown-pile")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<NgApiResponse<List<LotoPointDto>>> walkdownPile(
            @RequestParam(required = false) List<Long> standardIds,
            @RequestParam(required = false) List<Long> locationIds,
            @RequestParam(required = false) List<Long> eqTypeIds,
            @RequestParam(required = false) Long isoPosId,
            @RequestParam(required = false) Long normPosId,
            @RequestParam(required = false) List<String> systems,
            @RequestParam(required = false) String unit,
            @RequestParam(required = false) String tagNumber,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String specificLocation) {
        try {
            boolean hasStandards = standardIds != null && !standardIds.isEmpty();
            boolean hasLocationIds = locationIds != null && !locationIds.isEmpty();
            boolean hasEqTypeIds = eqTypeIds != null && !eqTypeIds.isEmpty();
            boolean hasSystems = systems != null && !systems.isEmpty() && systems.stream().anyMatch(this::nonBlankInstance);
            boolean anyFilter = hasStandards || hasLocationIds || hasEqTypeIds || hasSystems
                    || isoPosId != null || normPosId != null
                    || nonBlank(unit) || nonBlank(tagNumber) || nonBlank(description) || nonBlank(specificLocation);
            if (!anyFilter) {
                return ResponseEntity.badRequest()
                        .body(new NgApiResponse<>(List.of(), "Provide at least one filter"));
            }

            // JPQL empty-IN is a syntax error — pass a placeholder single-value list with the
            // corresponding hasX flag set to false so the query short-circuits that predicate.
            java.util.List<Long> locIds = hasLocationIds ? locationIds : java.util.List.of(-1L);
            java.util.List<Long> etIds = hasEqTypeIds ? eqTypeIds : java.util.List.of(-1L);
            java.util.List<String> sysList = hasSystems
                    ? systems.stream().filter(this::nonBlankInstance).map(s -> s.trim().toLowerCase()).collect(Collectors.toList())
                    : java.util.List.of("__none__");

            java.util.LinkedHashMap<Long, LotoPointDto> byId = new java.util.LinkedHashMap<>();

            // Non-standard filters → single DB query with fetch joins and multi-value INs.
            java.util.List<LotoPoint> filtered = lotoPointRepo.findPointsForPile(
                    hasLocationIds, locIds,
                    hasEqTypeIds, etIds,
                    hasSystems, sysList,
                    isoPosId, normPosId,
                    nonBlank(unit) ? unit.trim().toLowerCase() : null,
                    nonBlank(tagNumber) ? tagNumber.trim().toLowerCase() : null,
                    nonBlank(description) ? description.trim().toLowerCase() : null,
                    nonBlank(specificLocation) ? specificLocation.trim().toLowerCase() : null);
            for (LotoPoint p : filtered) byId.putIfAbsent(p.getId(), lotoPointService.toDto(p));

            // If standards are also selected, narrow to their union of points (still one DB query,
            // fetch-joined). We intersect with the filter result so both criteria apply.
            if (hasStandards) {
                java.util.Set<Long> pointIdsOnStandards = new java.util.HashSet<>();
                for (LotoPoint p : lotoPointRepo.findPointsOnStandards(standardIds)) {
                    pointIdsOnStandards.add(p.getId());
                }
                if (!anyFilter || (!hasLocationIds && !hasEqTypeIds && !hasSystems && isoPosId == null
                        && normPosId == null && !nonBlank(unit) && !nonBlank(tagNumber)
                        && !nonBlank(description) && !nonBlank(specificLocation))) {
                    // Standards were the ONLY filter — populate byId with just those points.
                    byId.clear();
                    for (LotoPoint p : lotoPointRepo.findPointsOnStandards(standardIds)) {
                        byId.putIfAbsent(p.getId(), lotoPointService.toDto(p));
                    }
                } else {
                    // Standards AND other filters → keep only rows present in both.
                    byId.keySet().removeIf(id -> !pointIdsOnStandards.contains(id));
                }
            }

            return ResponseEntity.ok(new NgApiResponse<>(new java.util.ArrayList<>(byId.values()), "OK"));
        } catch (Exception e) {
            log.error("PWA walkdownPile failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new NgApiResponse<>(List.of(), "Failed to load points: " + e.getMessage()));
        }
    }

    private static boolean nonBlank(String s) { return s != null && !s.isBlank(); }
    private boolean nonBlankInstance(String s) { return nonBlank(s); }

    /**
     * Every point→drawing occurrence for a set of LOTO point ids. Standard-scope-free equivalent of
     * {@code PwaLotoStandardController#drawings(id)}; the points-pile walkdown selects points without
     * a single standard context, so it can't reuse the per-standard resolver. Body is
     * {@code { "pointIds": [1, 2, 3] }} — POST rather than a long querystring since the pile can be
     * hundreds of points.
     */
    @PostMapping("/drawings")
    public ResponseEntity<NgApiResponse<List<PointDrawingDto>>> drawingsForPoints(@RequestBody Map<String, List<Long>> body) {
        try {
            List<Long> pointIds = body != null ? body.get("pointIds") : null;
            if (pointIds == null || pointIds.isEmpty()) {
                return ResponseEntity.ok(new NgApiResponse<>(List.of(), "No point ids"));
            }
            return ResponseEntity.ok(new NgApiResponse<>(drawingService.drawingsForPoints(pointIds), "Drawings"));
        } catch (Exception e) {
            log.error("PWA drawingsForPoints failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new NgApiResponse<>(List.of(), "Failed to load drawings: " + e.getMessage()));
        }
    }

    /**
     * Distinct free-text `system` values across every active LOTO point — DB-side DISTINCT (one
     * short query), not an in-memory scan of every DTO like the earlier version.
     */
    @GetMapping("/systems")
    public ResponseEntity<NgApiResponse<List<String>>> distinctSystems() {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(lotoPointRepo.findDistinctSystems(), "OK"));
        } catch (Exception e) {
            log.error("PWA distinctSystems failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new NgApiResponse<>(List.of(), "Failed to load systems: " + e.getMessage()));
        }
    }

    /**
     * Options bundle for the "walk down by filter" picker on the PWA — distinct free-text unit
     * values so the picker can populate its Unit dropdown. Systems come from {@code /systems};
     * locations / positions / eqType are on {@code /positions}. All three now hit DB-side DISTINCT
     * (no in-memory iteration of the entire point corpus, which was the 20-second cause).
     */
    @GetMapping("/filter-options")
    public ResponseEntity<NgApiResponse<java.util.Map<String, Object>>> filterOptions() {
        try {
            java.util.Map<String, Object> options = new java.util.LinkedHashMap<>();
            options.put("units", lotoPointRepo.findDistinctUnits());
            return ResponseEntity.ok(new NgApiResponse<>(options, "OK"));
        } catch (Exception e) {
            log.error("PWA filterOptions failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new NgApiResponse<>(java.util.Map.of(), "Failed: " + e.getMessage()));
        }
    }

    /**
     * Apply ONE point's correction immediately — the points-pile walkdown submits per-point as the
     * walker taps Verified / edits inline, not in a batch (no standard-level draft to hang the
     * evidence off). Uses the same {@link PwaLotoStandardWalkdownService#applyCorrection} the
     * standard walkdown submit uses, so the role gate (CONTROL_AUTHORITY / MANAGER) and JPA
     * plumbing (sync via FieldChangeEntityListener) are identical.
     */
    @PostMapping("/{pointId}/apply-correction")
    public ResponseEntity<NgApiResponse<LotoPointDto>> applyPointCorrection(
            @PathVariable Long pointId,
            @RequestBody WalkdownSubmitRequest.PointCorrectionInput c) {
        try {
            if (c == null) return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Correction body required"));
            walkdownService.applyCorrection(pointId, c.tagNumber(), c.description(),
                    c.isoPosId(), c.normPosId(), c.locationId(), c.specificLocation(),
                    c.isLockable(), c.isLabeled(), c.isVerified());
            LotoPointDto fresh = lotoPointService.findDtoById(pointId).orElse(null);
            return ResponseEntity.ok(new NgApiResponse<>(fresh, "Correction applied"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        } catch (Exception e) {
            log.error("PWA applyPointCorrection failed for point {}", pointId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new NgApiResponse<>(null, "Failed to apply correction: " + e.getMessage()));
        }
    }

    // ── Photos ─────────────────────────────────────────────────────────────

    /**
     * List photos currently attached to the LOTO point. Shallow FileDtos
     * (id / name / link / extension) — enough for the mobile thumbnail
     * grid; bytes are fetched separately by the browser via the fileLink.
     */
    @GetMapping("/{pointId}/photos")
    public ResponseEntity<NgApiResponse<List<FileDto>>> getPhotos(@PathVariable Long pointId) {
        try {
            LotoPointDto point = lotoPointService.findDtoById(pointId).orElse(null);
            if (point == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new NgApiResponse<>(null, "LOTO Point not found: " + pointId));
            }
            List<FileDto> photos = point.getPictures() != null ? point.getPictures() : List.of();
            return ResponseEntity.ok(new NgApiResponse<>(photos, "OK"));
        } catch (Exception e) {
            log.error("PWA getPhotos failed for point {}", pointId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new NgApiResponse<>(null, "Failed to load photos: " + e.getMessage()));
        }
    }

    /**
     * Stream one attached picture's bytes so the PWA can render it with a JWT-authed
     * {@code HttpClient.get(..., {responseType: 'blob'})} → {@code URL.createObjectURL(blob)} —
     * same pattern Maximo's {@code fetchWoAttachment} uses. Bypasses the raw {@code /uploads/**}
     * URL (which is behind IIS auth and would 401 the PWA into a native credential prompt).
     *
     * <p>Scope-checks that {@code fileId} is actually attached to {@code pointId} so a Plant user
     * cannot enumerate arbitrary FileObject ids on the hub via this endpoint.
     */
    @GetMapping("/{pointId}/photos/{fileId}/content")
    @Transactional(readOnly = true)
    public ResponseEntity<Resource> getPhotoContent(@PathVariable Long pointId,
                                                    @PathVariable Long fileId) {
        try {
            // Attachment scope-check via a native COUNT on the join table rather than
            // point.getPictures().stream() — a lazy M2M walk here used to throw
            // LazyInitializationException the moment the outer @Transactional closed, which the
            // catch below turned into a silent 500 with an empty body (Content-Length: 0). The
            // COUNT stays cheap and never triggers a full collection load.
            //
            // @Transactional(readOnly = true) is also declared on the method so the FileObject +
            // its lazy fields can be safely read below without another detach.
            Long attachedCount = ((Number) entityManager.createNativeQuery(
                            "SELECT COUNT(*) FROM loto_point_picture WHERE loto_point_id = :p AND file_id = :f")
                    .setParameter("p", pointId)
                    .setParameter("f", fileId)
                    .getSingleResult()).longValue();
            if (attachedCount == null || attachedCount == 0L) {
                log.debug("PWA getPhotoContent: file {} not attached to point {}", fileId, pointId);
                return ResponseEntity.notFound().build();
            }

            FileObject file = fileRepo.findById(fileId).orElse(null);
            if (file == null) {
                log.warn("PWA getPhotoContent: FileObject {} missing for point {}", fileId, pointId);
                return ResponseEntity.notFound().build();
            }
            String storedLink = file.getFileLink();
            if (storedLink == null || storedLink.isBlank()) {
                log.warn("PWA getPhotoContent: FileObject {} has no fileLink (fileType/vendor null?) for point {}",
                        fileId, pointId);
                return ResponseEntity.notFound().build();
            }

            // Resolve the stored fileLink ("uploads/<ext>/<type>/<vendor>/<num>.<ext>") against the
            // absolute uploads root by stripping the leading "uploads/" segment — same pattern the
            // sync FileFixesTestController uses.
            String link = storedLink.replace('\\', '/').replaceFirst("^/+", "");
            int slash = link.indexOf('/');
            Path onDisk = (slash >= 0)
                    ? Paths.get(filesRootPath).resolve(link.substring(slash + 1))
                    : Paths.get(filesRootPath).resolve(link);
            if (!Files.exists(onDisk) || !Files.isReadable(onDisk)) {
                log.warn("PWA getPhotoContent: file on disk missing for point {} file {} — link='{}', resolved={}",
                        pointId, fileId, storedLink, onDisk);
                return ResponseEntity.notFound().build();
            }

            MediaType contentType = mediaTypeForExtension(file.getExtension());
            String downloadName = (file.getName() != null && !file.getName().isBlank())
                    ? file.getName() : ("photo-" + fileId);
            String extLower = file.getExtension() != null ? file.getExtension().toLowerCase() : "";
            if (!extLower.isBlank() && !downloadName.toLowerCase().endsWith("." + extLower)) {
                downloadName = downloadName + "." + extLower;
            }

            return ResponseEntity.ok()
                    .contentType(contentType)
                    // inline so <img> can render it directly; the filename hint is still respected
                    // if the user "Save" from the fullscreen viewer.
                    .header("Content-Disposition", "inline; filename=\"" + downloadName.replace("\"", "'") + "\"")
                    .body(new FileSystemResource(onDisk));
        } catch (Exception e) {
            // Include the exception class name so a 500 in the network tab tells us WHY without
            // needing to tail the hub log — the previous silent 500 (empty Content-Length) hid
            // exactly this class of failure until an ai-diagnostics dump made it visible.
            log.error("PWA getPhotoContent failed for point {} file {} — {}: {}",
                    pointId, fileId, e.getClass().getSimpleName(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Best-effort MIME lookup by file extension so the PWA gets a Content-Type it can render
     * inline (image / video / pdf). Anything unknown falls back to {@code application/octet-stream}
     * — the browser will offer a download instead of trying to render junk.
     */
    private static MediaType mediaTypeForExtension(String ext) {
        if (ext == null) return MediaType.APPLICATION_OCTET_STREAM;
        return switch (ext.toLowerCase()) {
            case "jpg", "jpeg" -> MediaType.IMAGE_JPEG;
            case "png" -> MediaType.IMAGE_PNG;
            case "gif" -> MediaType.IMAGE_GIF;
            case "webp" -> MediaType.valueOf("image/webp");
            case "bmp" -> MediaType.valueOf("image/bmp");
            case "heic" -> MediaType.valueOf("image/heic");
            case "heif" -> MediaType.valueOf("image/heif");
            case "pdf" -> MediaType.APPLICATION_PDF;
            case "mp4", "m4v" -> MediaType.valueOf("video/mp4");
            case "mov" -> MediaType.valueOf("video/quicktime");
            case "webm" -> MediaType.valueOf("video/webm");
            case "txt", "csv" -> MediaType.valueOf("text/plain");
            default -> MediaType.APPLICATION_OCTET_STREAM;
        };
    }

    /**
     * Attach one or more photos taken/picked on mobile. Multipart batch:
     * NgLotoPointService.uploadPictures handles dedup, on-disk storage,
     * sync tracking, and metadata stamping (name = LOTO description,
     * system = LOTO systemValue).
     */
    @PostMapping(value = "/{pointId}/photos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<NgApiResponse<List<FileDto>>> uploadPhotos(
            @PathVariable Long pointId,
            @RequestParam("files") List<MultipartFile> files) {
        try {
            LotoPointDto updated = lotoPointService.uploadPictures(pointId, files);
            List<FileDto> photos = updated.getPictures() != null ? updated.getPictures() : List.of();
            // Stamp createdBy explicitly on the freshly-uploaded FileObjects.
            // @EnableJpaAuditing is off project-wide so the auditor doesn't
            // fill this in for us; without it the deletePhoto author guard
            // below has nothing to check against. Only stamps NEW uploads —
            // the same user could re-upload an existing (SHA-256-deduped)
            // file whose createdBy is already set by someone else; leaving
            // that alone is correct (original author retains ownership).
            String author = currentUserName();
            if (author != null && !author.isBlank() && !photos.isEmpty()) {
                stampFileObjectCreatedBy(photos, author);
            }
            return ResponseEntity.ok(new NgApiResponse<>(photos, "Photos attached"));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new NgApiResponse<>(null, e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, e.getMessage()));
        } catch (Exception e) {
            log.error("PWA uploadPhotos failed for point {}", pointId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new NgApiResponse<>(null, "Photo upload failed: " + e.getMessage()));
        }
    }

    /**
     * Detach a photo from a LOTO point (unlinks the M2M row; the underlying
     * FileObject survives — it may still be attached to another point).
     * Anyone with PWA-Plant access can detach; matches the desktop's
     * @RestrictedAllowed on the same operation.
     */
    @DeleteMapping("/{pointId}/photos/{fileId}")
    public ResponseEntity<NgApiResponse<List<FileDto>>> deletePhoto(
            @PathVariable Long pointId, @PathVariable Long fileId) {
        try {
            // Author-only guard, fail-closed (matches deleteComment). A LOTO
            // walkdown crew member can wipe another operator's evidence
            // otherwise. Files without a createdBy (uploaded by desktop or
            // pre-audit-stamping) can't be deleted from the PWA — desktop's
            // /ng/loto-points/{id}/pictures/{fileId} still handles those
            // via the ordinary Restricted-access moderation flow.
            FileObject file = fileRepo.findById(fileId).orElse(null);
            if (file == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new NgApiResponse<>(null, "File not found: " + fileId));
            }
            String currentUser = currentUserName();
            String author = file.getCreatedBy();
            if (currentUser == null || author == null || !author.equals(currentUser)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new NgApiResponse<>(null,
                                "Only the photo's uploader can detach it from the PWA."));
            }
            LotoPointDto updated = lotoPointService.removePicture(pointId, fileId);
            List<FileDto> photos = updated.getPictures() != null ? updated.getPictures() : List.of();
            return ResponseEntity.ok(new NgApiResponse<>(photos, "Photo removed"));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new NgApiResponse<>(null, e.getMessage()));
        } catch (Exception e) {
            log.error("PWA deletePhoto failed for point {} file {}", pointId, fileId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new NgApiResponse<>(null, "Failed to remove photo: " + e.getMessage()));
        }
    }

    // ── Comments ───────────────────────────────────────────────────────────

    /**
     * List comments on this LOTO point, newest-first. Includes soft-deleted
     * comments? NO — {@code Comment} extends BaseAuditEntity which applies
     * the {@code deleted = false} filter via {@code @Where}, so removed
     * comments never surface.
     */
    @GetMapping("/{pointId}/comments")
    public ResponseEntity<NgApiResponse<List<CommentDto>>> getComments(@PathVariable Long pointId) {
        try {
            List<CommentDto> comments = commentService.getCommentsForEntity(
                    LOTO_POINT_ENTITY_TYPE, pointId);
            return ResponseEntity.ok(new NgApiResponse<>(comments, "OK"));
        } catch (Exception e) {
            log.error("PWA getComments failed for point {}", pointId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new NgApiResponse<>(null, "Failed to load comments: " + e.getMessage()));
        }
    }

    /**
     * Post a new comment on the LOTO point. Body is {@code {"content": "..."}}
     * — needsAttention / isResolved / commentType default to null/false;
     * mobile can add them later if that surfaces on the PWA UI.
     * <p>
     * Author (createdBy) is populated by Spring Data Auditing from the JWT
     * principal — no client-supplied author to trust.
     */
    @PostMapping("/{pointId}/comments")
    public ResponseEntity<NgApiResponse<CommentDto>> addComment(
            @PathVariable Long pointId, @RequestBody Map<String, Object> body) {
        try {
            Object contentRaw = body != null ? body.get("content") : null;
            String content = contentRaw != null ? contentRaw.toString().trim() : "";
            if (content.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new NgApiResponse<>(null, "Comment content is required"));
            }
            if (content.length() > MAX_COMMENT_CONTENT_LENGTH) {
                return ResponseEntity.badRequest()
                        .body(new NgApiResponse<>(null,
                                "Comment is too long — " + content.length()
                                        + " chars (max " + MAX_COMMENT_CONTENT_LENGTH + ")."));
            }
            LotoPointDto point = lotoPointService.findDtoById(pointId).orElse(null);
            if (point == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new NgApiResponse<>(null, "LOTO Point not found: " + pointId));
            }
            Comment fresh = new Comment();
            fresh.setContent(content);
            fresh.setEntityType(LOTO_POINT_ENTITY_TYPE);
            fresh.setEntityId(pointId);
            // Set createdBy EXPLICITLY. @EnableJpaAuditing is currently commented
            // out project-wide (see AuditingConfig / BaseAuditEntity), so
            // Spring's auditor won't fill this in. Without an explicit set the
            // author-only delete guard below (deleteComment) fails OPEN because
            // getCreatedBy() returns null and the null check short-circuits.
            String author = currentUserName();
            if (author != null && !author.isBlank()) {
                fresh.setCreatedBy(author);
            }
            Comment saved = commentService.save(fresh);
            CommentDto dto = commentService.toDto(saved);
            return ResponseEntity.ok(new NgApiResponse<>(dto, "Comment posted"));
        } catch (Exception e) {
            log.error("PWA addComment failed for point {}", pointId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new NgApiResponse<>(null, "Failed to post comment: " + e.getMessage()));
        }
    }

    /**
     * Soft-delete a comment. Guarded: only the author (createdBy) may delete
     * their own comment. Rationale — restricted mobile users share a single
     * class-level auth grant; without this guard a Plant user could wipe
     * out another operator's evidence. Desktop and admins can still delete
     * via the ordinary {@code /ng/comments/{id}} endpoint if a moderation
     * action is needed.
     */
    @DeleteMapping("/{pointId}/comments/{commentId}")
    public ResponseEntity<NgApiResponse<Void>> deleteComment(
            @PathVariable Long pointId, @PathVariable Long commentId) {
        try {
            Comment existing = commentService.findById(commentId).orElse(null);
            if (existing == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new NgApiResponse<>(null, "Comment not found: " + commentId));
            }
            if (!LOTO_POINT_ENTITY_TYPE.equals(existing.getEntityType())
                    || !pointId.equals(existing.getEntityId())) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new NgApiResponse<>(null,
                                "Comment " + commentId + " is not on LOTO Point " + pointId));
            }
            String currentUser = currentUserName();
            // Fail CLOSED: reject when createdBy is null OR mismatched. Comments
            // predating the explicit-setCreatedBy fix (or created via a code
            // path that bypasses it) will refuse deletion entirely — desktop
            // /ng/comments/{id} can still moderate if a legitimate cleanup is
            // needed.
            String author = existing.getCreatedBy();
            if (currentUser == null || author == null || !author.equals(currentUser)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new NgApiResponse<>(null,
                                "Only the comment's author can delete it."));
            }
            commentService.softDelete(existing);
            return ResponseEntity.ok(new NgApiResponse<>(null, "Comment removed"));
        } catch (Exception e) {
            log.error("PWA deleteComment failed for point {} comment {}", pointId, commentId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new NgApiResponse<>(null, "Failed to remove comment: " + e.getMessage()));
        }
    }

    // ── helpers ────────────────────────────────────────────────────────────

    private String currentUserName() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            return auth != null ? auth.getName() : null;
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Set FileObject.createdBy = uploader on newly-uploaded photos that don't
     * already have one. Only touches files with null createdBy so a
     * SHA-256-deduped re-upload doesn't overwrite the original author.
     */
    private void stampFileObjectCreatedBy(List<FileDto> photos, String author) {
        for (FileDto dto : photos) {
            if (dto == null || dto.getId() == null) continue;
            try {
                fileRepo.findById(dto.getId()).ifPresent(fo -> {
                    if (fo.getCreatedBy() == null) {
                        fo.setCreatedBy(author);
                        fileRepo.save(fo);
                    }
                });
            } catch (Exception e) {
                log.warn("PWA: failed to stamp createdBy on file {}: {}",
                        dto.getId(), e.getMessage());
            }
        }
    }
}
