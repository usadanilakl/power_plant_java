package com.dk_power.power_plant_java.controller.angular.loto;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.permits.loto_standard.LotoStandardDto;
import com.dk_power.power_plant_java.dto.permits.loto_standard.RedTagStandardDto;
import com.dk_power.power_plant_java.dto.permits.loto_standard.RedTagStandardMatchDto;
import com.dk_power.power_plant_java.sevice.angular.loto.NgRedTagStandardService;
import com.dk_power.power_plant_java.config.security.RestrictedAllowed;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Angular-facing controller for Red Tag standards — the digitized
 * representations of LOTO standards that live inside the external Red Tag
 * system. See {@code red-tag-standards-plan.md}.
 *
 * <p>Phase A exposes CRUD + the manual seed import. Phase B adds
 * {@code /matches} and {@code /generate-standard}.
 */
@RestController
@RequestMapping("/ng/red-tag-standards")
@RequiredArgsConstructor
@RestrictedAllowed
public class NgRedTagStandardController {

    private final NgRedTagStandardService service;

    @GetMapping
    public ResponseEntity<NgApiResponse<List<RedTagStandardDto>>> getAll() {
        return ResponseEntity.ok(new NgApiResponse<>(service.getAllDtos(), "Red Tag standards retrieved"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<NgApiResponse<RedTagStandardDto>> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(service.getById(id), "Red Tag standard retrieved"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<NgApiResponse<RedTagStandardDto>> update(
            @PathVariable Long id, @RequestBody RedTagStandardDto dto) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(service.update(id, dto), "Red Tag standard updated"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<NgApiResponse<Void>> delete(@PathVariable Long id) {
        try {
            service.delete(id);
            return ResponseEntity.ok(new NgApiResponse<>(null, "Red Tag standard deleted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * Manually import the bundled Red Tag standards seed. Idempotent — a
     * standard whose name already exists is skipped. Triggered on demand by
     * an admin (never auto-run on startup) to avoid duplicate rows across
     * the many desktop clients that sync to the shared hub.
     */
    @PostMapping("/import")
    public ResponseEntity<NgApiResponse<NgRedTagStandardService.ImportResult>> importSeed() {
        try {
            NgRedTagStandardService.ImportResult result = service.importSeed();
            return ResponseEntity.ok(new NgApiResponse<>(result,
                    "Imported " + result.created() + " new, skipped " + result.skipped() + " existing"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * Per-row reconciliation against the local LOTO point database — each
     * row resolves to MATCHED / MULTIPLE / NONE with the suggested points.
     */
    @GetMapping("/{id}/matches")
    public ResponseEntity<NgApiResponse<List<RedTagStandardMatchDto>>> getMatches(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(service.getMatches(id), "Row matches resolved"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * Generate a native LOTO standard from the selected LOTO point ids.
     * Body: {@code { name?: string, lotoPointIds: number[] }}.
     */
    @PostMapping("/{id}/generate-standard")
    public ResponseEntity<NgApiResponse<LotoStandardDto>> generateStandard(
            @PathVariable Long id, @RequestBody GenerateStandardRequest body) {
        try {
            LotoStandardDto created = service.generateStandard(id, body.name(), body.lotoPointIds());
            return ResponseEntity.ok(new NgApiResponse<>(created, "LOTO standard generated"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /** Request body for {@link #generateStandard}. */
    public record GenerateStandardRequest(String name, List<Long> lotoPointIds) {}
}
