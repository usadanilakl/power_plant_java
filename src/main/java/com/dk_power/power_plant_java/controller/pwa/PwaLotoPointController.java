package com.dk_power.power_plant_java.controller.pwa;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.base_dtos.CommentDto;
import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointDto;
import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointIdDto;
import com.dk_power.power_plant_java.dto.permits.loto_standard.WalkdownSubmitRequest;
import com.dk_power.power_plant_java.entities.base_entities.Comment;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.entities.loto.LotoStandard;
import com.dk_power.power_plant_java.entities.users.LotoRole;
import com.dk_power.power_plant_java.repository.file.FileRepo;
import com.dk_power.power_plant_java.repository.loto.LotoPointRepo;
import com.dk_power.power_plant_java.repository.loto.LotoStandardRepo;
import com.dk_power.power_plant_java.sevice.angular.NgCommentService;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoPointService;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoStandardService;
import com.dk_power.power_plant_java.sevice.pwa.PwaLotoStandardWalkdownService;

import java.util.stream.Collectors;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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
    private final LotoStandardRepo lotoStandardRepo;
    private final LotoPointRepo lotoPointRepo;
    private final NgLotoStandardService lotoStandardService;

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
     * Return a de-duplicated pile of LOTO points selected by any combination of criteria:
     * <ul>
     *   <li>{@code standardIds} — union of every point on the given LOTO standards</li>
     *   <li>{@code locationId} — filter to points whose {@code location} Value id matches</li>
     *   <li>{@code system}     — filter to points whose {@code system} free-text (LotoPointDto.system)
     *       matches (case-insensitive). LotoPointDto doesn't ship the systemValue Value FK so the
     *       string is what we key on for now.</li>
     * </ul>
     * When both a standardIds set and a location/system filter are supplied the location/system
     * acts as a further filter on the pile. When only standardIds is empty and a filter is
     * supplied we scan every non-deleted LOTO point (small dataset in practice — dozens per
     * location, hundreds per system). Response is a fat {@link LotoPointDto} so the mobile
     * dialog has isoPos/normPos/location/system/isLabeled/isLockable/isVerified without a
     * second round-trip per point.
     */
    @GetMapping("/walkdown-pile")
    public ResponseEntity<NgApiResponse<List<LotoPointDto>>> walkdownPile(
            @RequestParam(required = false) List<Long> standardIds,
            @RequestParam(required = false) Long locationId,
            @RequestParam(required = false) String system) {
        try {
            java.util.LinkedHashMap<Long, LotoPointDto> byId = new java.util.LinkedHashMap<>();
            if (standardIds != null && !standardIds.isEmpty()) {
                for (LotoStandard s : lotoStandardRepo.findAllById(standardIds)) {
                    if (Boolean.TRUE.equals(s.getDeleted()) || s.getLotoPoints() == null) continue;
                    for (LotoPoint p : s.getLotoPoints()) {
                        if (p == null || Boolean.TRUE.equals(p.getDeleted())) continue;
                        byId.putIfAbsent(p.getId(), lotoPointService.toDto(p));
                    }
                }
            } else if (locationId != null || (system != null && !system.isBlank())) {
                // No standards selected → scan all points and filter. `findAll()` is bounded by
                // the deleted-filter on the entity, so we don't drag soft-deleted rows.
                for (LotoPointDto dto : lotoPointService.getAllDtos()) {
                    if (matchesFilter(dto, locationId, system)) byId.putIfAbsent(dto.getId(), dto);
                }
            } else {
                return ResponseEntity.badRequest()
                        .body(new NgApiResponse<>(List.of(), "Provide standardIds, locationId, or system"));
            }
            // Apply location/system filter on top of standardIds too (further-narrow semantics).
            List<LotoPointDto> pile = new java.util.ArrayList<>(byId.values());
            if (locationId != null || (system != null && !system.isBlank())) {
                pile.removeIf(dto -> !matchesFilter(dto, locationId, system));
            }
            return ResponseEntity.ok(new NgApiResponse<>(pile, "OK"));
        } catch (Exception e) {
            log.error("PWA walkdownPile failed (standards={}, location={}, system={})",
                    standardIds, locationId, system, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new NgApiResponse<>(List.of(), "Failed to load points: " + e.getMessage()));
        }
    }

    /**
     * Distinct free-text `system` values across every LOTO point — for populating the
     * "walk down by system" picker on the PWA. Cheap: iterates the fat DTO list once.
     */
    @GetMapping("/systems")
    public ResponseEntity<NgApiResponse<List<String>>> distinctSystems() {
        try {
            java.util.TreeSet<String> systems = new java.util.TreeSet<>(String.CASE_INSENSITIVE_ORDER);
            for (LotoPointDto dto : lotoPointService.getAllDtos()) {
                if (dto.getSystem() != null && !dto.getSystem().isBlank()) systems.add(dto.getSystem().trim());
            }
            return ResponseEntity.ok(new NgApiResponse<>(new java.util.ArrayList<>(systems), "OK"));
        } catch (Exception e) {
            log.error("PWA distinctSystems failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new NgApiResponse<>(List.of(), "Failed to load systems: " + e.getMessage()));
        }
    }

    private static boolean matchesFilter(LotoPointDto dto, Long locationId, String system) {
        if (locationId != null) {
            Long loc = dto.getLocation() != null ? dto.getLocation().getId() : null;
            if (loc == null || !loc.equals(locationId)) return false;
        }
        if (system != null && !system.isBlank()) {
            String s = dto.getSystem();
            if (s == null || !s.trim().equalsIgnoreCase(system.trim())) return false;
        }
        return true;
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
