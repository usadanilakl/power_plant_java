package com.dk_power.power_plant_java.controller.pwa;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.dto.permits.LotoIdDto;
import com.dk_power.power_plant_java.dto.permits.loto_permit.PwaLotoDtos.*;
import com.dk_power.power_plant_java.dto.permits.loto_standard.PointDrawingDto;
import com.dk_power.power_plant_java.dto.permits.loto_standard.PositionOptionsDto;
import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.repository.loto.LotoRepo;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoService;
import com.dk_power.power_plant_java.sevice.pwa.PwaLotoDrawingService;
import com.dk_power.power_plant_java.sevice.pwa.PwaLotoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Mobile (PWA) LOTO permit hang / verify / walkdown — under {@code /api/pwa/secured/loto/**} (JWT + ROLE_PLANT/ADMIN).
 * Mirrors the LOTO-Standards PWA surface: read endpoints + positions/drawings, a grab per phase, and one batch submit
 * per flow. Thin proxy over {@link PwaLotoService}; all role/SoD/predecessor gates stay server-authoritative.
 */
@RestController
@RequestMapping("/api/pwa/secured/loto")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(originPatterns = {"https://dk-power.github.io", "https://jacksongeneration.github.io", "http://localhost:*", "http://127.0.0.1:*"}, allowCredentials = "true")
public class PwaLotoController {

    private final PwaLotoService service;
    private final PwaLotoDrawingService drawingService;
    private final LotoRepo lotoRepo;
    private final NgLotoService lotoService;

    // ── inactive-permit edit ────────────────────────────────────────────────

    /**
     * Detach a LOTO point from a LOTO permit — allowed only while the permit is Building.
     * Delegates to the desktop {@code removeLotoPointFromLoto} which handles CA gating
     * + structurally-editable state check (rejects Active/Test/Closed) already; the
     * Building-status gate here is just a cleaner 409 message before the delegate call.
     */
    @DeleteMapping("/{lotoId}/points/{pointId}")
    public ResponseEntity<NgApiResponse<LotoDto>> removePointFromInactivePermit(
            @PathVariable Long lotoId, @PathVariable Long pointId) {
        try {
            Loto loto = lotoRepo.findById(lotoId).orElse(null);
            if (loto == null) return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new NgApiResponse<>(null, "LOTO not found: " + lotoId));
            String status = loto.getPermitStatus() != null ? loto.getPermitStatus().getName() : null;
            if (!"Building".equals(status)) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(new NgApiResponse<>(null,
                        "This permit is " + status + " — points can only be removed while Building"));
            }
            LotoDto updated = lotoService.removeLotoPointFromLoto(pointId, lotoId);
            return ResponseEntity.ok(new NgApiResponse<>(updated, "Point removed from permit"));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new NgApiResponse<>(null, e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        } catch (Exception e) {
            log.error("PWA removePointFromInactivePermit failed (loto={}, point={})", lotoId, pointId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new NgApiResponse<>(null, "Failed to remove point: " + e.getMessage()));
        }
    }

    /**
     * Attach an existing LOTO point to a permit — the field counterpart of the picker on the standard.
     *
     * <p>Deliberately thin: {@link NgLotoService#addLotoPointToLoto} already requires CONTROL_AUTHORITY
     * and {@code requireStructurallyEditable} (Building or Modification, never Test — loto-procedure.md
     * §4.2), and flags a Modification-added point for re-hang. Re-stating any of that here would be a
     * second copy of the rule that could drift from the one that actually decides. This method only
     * translates the refusals into status codes the phone can render.</p>
     */
    @PostMapping("/{lotoId}/points/{pointId}")
    public ResponseEntity<NgApiResponse<LotoDto>> addPointToPermit(
            @PathVariable Long lotoId, @PathVariable Long pointId) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(lotoService.addLotoPointToLoto(pointId, lotoId), "Point added"));
        } catch (SecurityException e) {
            // Not a CA (nor Qualified, which the delegate accepts in its place) — a permission answer,
            // not a validation one, so 403 rather than folding it in with the status refusals below.
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new NgApiResponse<>(null, e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new NgApiResponse<>(null, e.getMessage()));
        } catch (jakarta.persistence.EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new NgApiResponse<>(null, e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        } catch (Exception e) {
            log.error("PWA addPointToPermit failed (loto={}, point={})", lotoId, pointId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new NgApiResponse<>(null, "Failed to add point: " + e.getMessage()));
        }
    }

    /**
     * Edit a LOTO permit's basic fields from the PWA — allowed ONLY while the permit is in
     * "Building" (i.e. inactive, pre-activation). Any other status is 409 with a hint.
     *
     * <p>Behaves as a pass-through to {@link NgLotoService#updateAndConvert} — the desktop's
     * defensive guards (archived-check, status-mismatch reject) apply automatically. This
     * endpoint's contribution is the Building-only gate: verifiers on an Active/Test/Closed
     * permit shouldn't be reshaping requestor/workScope/system in the field.
     */
    @PutMapping("/{id}/basic")
    public ResponseEntity<NgApiResponse<LotoDto>> updateInactiveBasic(
            @PathVariable Long id, @RequestBody LotoIdDto body) {
        try {
            Loto loto = lotoRepo.findById(id).orElse(null);
            if (loto == null) return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new NgApiResponse<>(null, "LOTO not found: " + id));
            String status = loto.getPermitStatus() != null ? loto.getPermitStatus().getName() : null;
            if (!"Building".equals(status)) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(new NgApiResponse<>(null,
                        "This permit is " + status + " — only Building permits can be edited from the PWA"));
            }
            body.setId(id);
            LotoDto updated = lotoService.updateAndConvert(body);
            return ResponseEntity.ok(new NgApiResponse<>(updated, "Permit saved"));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new NgApiResponse<>(null, e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        } catch (Exception e) {
            log.error("PWA updateInactiveBasic failed for loto {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new NgApiResponse<>(null, "Failed to save permit: " + e.getMessage()));
        }
    }

    // ── read ──

    /**
     * All LOTO permits — including ones this user cannot act on (Building before CA approval, Active
     * with nothing left to do). {@code phases} says what is actionable; an empty list means view-only.
     *
     * @param includeClosed Closed permits are off by default: unbounded history, nothing to act on.
     */
    @GetMapping("/list")
    public ResponseEntity<NgApiResponse<List<PwaLotoListItem>>> list(
            @RequestParam(name = "includeClosed", defaultValue = "false") boolean includeClosed) {
        return ok(new NgApiResponse<>(service.list(includeClosed), "loto permits"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<NgApiResponse<PwaLotoDetail>> detail(@PathVariable Long id) {
        try {
            return ok(new NgApiResponse<>(service.detail(id), "ok"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    // ── WO ↔ LOTO linking ──────────────────────────────────────────────────────
    @GetMapping("/active-light")
    public ResponseEntity<NgApiResponse<List<com.dk_power.power_plant_java.dto.permits.LotoLinkDto>>> activeLotos() {
        try { return ok(new NgApiResponse<>(lotoService.findActiveLight(), "ok")); }
        catch (Exception e) { return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage())); }
    }
    @GetMapping("/{id}/links")
    public ResponseEntity<NgApiResponse<com.dk_power.power_plant_java.dto.permits.LotoLinkDto>> lotoLinks(@PathVariable Long id) {
        try { return ok(new NgApiResponse<>(lotoService.findLinkById(id), "ok")); }
        catch (Exception e) { return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage())); }
    }
    @GetMapping("/for-wonum")
    public ResponseEntity<NgApiResponse<List<com.dk_power.power_plant_java.dto.permits.LotoLinkDto>>> lotosForWonum(@RequestParam("wonum") String wonum) {
        try { return ok(new NgApiResponse<>(lotoService.findByWonum(wonum), "ok")); }
        catch (Exception e) { return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage())); }
    }
    @PostMapping("/{id}/link-wo")
    public ResponseEntity<NgApiResponse<com.dk_power.power_plant_java.dto.permits.LotoLinkDto>> linkWo(@PathVariable Long id, @RequestParam("wonum") String wonum) {
        try { return ok(new NgApiResponse<>(lotoService.linkWo(id, wonum), "linked")); }
        catch (Exception e) { return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage())); }
    }
    @PostMapping("/{id}/unlink-wo")
    public ResponseEntity<NgApiResponse<com.dk_power.power_plant_java.dto.permits.LotoLinkDto>> unlinkWo(@PathVariable Long id, @RequestParam("wonum") String wonum) {
        try { return ok(new NgApiResponse<>(lotoService.unlinkWo(id, wonum), "unlinked")); }
        catch (Exception e) { return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage())); }
    }

    @GetMapping("/positions")
    public ResponseEntity<NgApiResponse<PositionOptionsDto>> positions() {
        return ok(new NgApiResponse<>(service.positions(), "positions"));
    }

    @GetMapping("/{id}/drawings")
    public ResponseEntity<NgApiResponse<List<PointDrawingDto>>> drawings(@PathVariable Long id) {
        try {
            return ok(new NgApiResponse<>(service.drawings(id), "drawings"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping("/files/{fileId}/image")
    public ResponseEntity<Resource> image(@PathVariable Long fileId) {
        try {
            Resource r = drawingService.imageResource(fileId);
            return ResponseEntity.ok().contentType(MediaType.IMAGE_JPEG).header("Cache-Control", "max-age=86400").body(r);
        } catch (Exception e) {
            log.warn("[PWA] LOTO drawing image {} unavailable: {}", fileId, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    // ── grab ──

    @PostMapping("/{id}/grab")
    public ResponseEntity<NgApiResponse<GrabInfo>> grab(@PathVariable Long id, @RequestParam String phase) {
        try {
            return ok(new NgApiResponse<>(service.grab(id, phase), "grabbed"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping("/{id}/release")
    public ResponseEntity<NgApiResponse<Void>> release(@PathVariable Long id, @RequestParam String phase) {
        service.release(id, phase);
        return ok(new NgApiResponse<>(null, "released"));
    }

    // ── submit ──

    @PostMapping("/{id}/hang/submit")
    public ResponseEntity<NgApiResponse<PhaseSubmitResult>> submitHang(@PathVariable Long id, @RequestBody HangSubmitRequest body) {
        try {
            return ok(new NgApiResponse<>(service.submitHang(id, body), "hang submitted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping("/{id}/verify/submit")
    public ResponseEntity<NgApiResponse<PhaseSubmitResult>> submitVerify(@PathVariable Long id, @RequestBody VerifySubmitRequest body) {
        try {
            return ok(new NgApiResponse<>(service.submitVerify(id, body), "verify submitted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    // ── walkdown (repeatable) ──

    @PostMapping("/{id}/walkdown/start")
    public ResponseEntity<NgApiResponse<PwaWalkdownSession>> startWalkdown(@PathVariable Long id, @RequestBody(required = false) WalkdownStartRequest body) {
        try {
            return ok(new NgApiResponse<>(service.startWalkdown(id, body), "walkdown started"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping("/{id}/walkdown/sessions")
    public ResponseEntity<NgApiResponse<List<PwaWalkdownSession>>> sessions(@PathVariable Long id) {
        return ok(new NgApiResponse<>(service.sessions(id), "sessions"));
    }

    @GetMapping("/walkdown/session/{sessionId}")
    public ResponseEntity<NgApiResponse<PwaWalkdownSession>> session(@PathVariable Long sessionId) {
        try {
            return ok(new NgApiResponse<>(service.getSession(sessionId), "session"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping("/walkdown/session/{sessionId}/submit")
    public ResponseEntity<NgApiResponse<PwaWalkdownSession>> submitWalkdown(@PathVariable Long sessionId, @RequestBody WalkdownSubmitRequest body) {
        try {
            return ok(new NgApiResponse<>(service.submitWalkdown(sessionId, body), "walkdown submitted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    private <T> ResponseEntity<NgApiResponse<T>> ok(NgApiResponse<T> body) {
        return ResponseEntity.ok(body);
    }
}
