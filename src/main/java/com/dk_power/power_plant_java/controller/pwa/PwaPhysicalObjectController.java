package com.dk_power.power_plant_java.controller.pwa;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.physical.PhysicalObjectAggregate;
import com.dk_power.power_plant_java.dto.physical.PhysicalObjectDto;
import com.dk_power.power_plant_java.entities.physical.PhysicalObject;
import com.dk_power.power_plant_java.repository.physical.PhysicalObjectRepo;
import com.dk_power.power_plant_java.sevice.physical.PhysicalObjectAggregateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Mobile (PWA) read/log access to the PhysicalObject informational binder — the "everything about this object" surface
 * the Rounds question-context view leans on (P&IDs, LOTO, Maximo WO/SR, real location, logs). Under
 * {@code /api/pwa/secured/physical-object/**} (JWT + ROLE_PLANT/ADMIN). Thin proxy over {@link PhysicalObjectAggregateService};
 * NOT gated on a Maximo key (the aggregate degrades gracefully — Maximo facet is best-effort).
 */
@RestController
@RequestMapping("/api/pwa/secured/physical-object")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(originPatterns = {"https://dk-power.github.io", "https://jacksongeneration.github.io", "http://localhost:*", "http://127.0.0.1:*"}, allowCredentials = "true")
public class PwaPhysicalObjectController {

    private final PhysicalObjectAggregateService aggregateService;
    private final PhysicalObjectRepo physicalObjectRepo;

    /**
     * Whole PhysicalObject hierarchy as a flat list (id + parentId + hasChildren) — the SAME payload the desktop
     * {@code /ng/physical-object/tree} serves, so the PWA can assemble the location+asset tree client-side and
     * offer it as an SR target picker. NOT gated on a Maximo key (the nodes are locally stored, Maximo-seeded).
     */
    @GetMapping("/tree")
    public ResponseEntity<NgApiResponse<List<PhysicalObjectDto>>> tree() {
        try {
            List<PhysicalObject> all = physicalObjectRepo.findAll();
            Set<Long> parents = all.stream()
                    .map(p -> p.getParent() != null ? p.getParent().getId() : null)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());
            List<PhysicalObjectDto> dtos = all.stream()
                    .map(p -> PhysicalObjectDto.from(p, parents.contains(p.getId())))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(new NgApiResponse<>(dtos, dtos.size() + " nodes"));
        } catch (Exception e) {
            log.warn("[PWA-PhysicalObject] tree failed: {}", e.getMessage());
            return ResponseEntity.ok(new NgApiResponse<>(List.of(), "Failed: " + e.getMessage()));
        }
    }

    /** The full binder for one object in a single call. */
    @GetMapping("/{id}/aggregate")
    public ResponseEntity<NgApiResponse<PhysicalObjectAggregate>> aggregate(@PathVariable Long id) {
        PhysicalObjectAggregate agg = aggregateService.aggregate(id, true);
        if (agg == null) return ResponseEntity.ok(new NgApiResponse<>(null, "not found"));
        return ResponseEntity.ok(new NgApiResponse<>(agg, "ok"));
    }

    /** Object-scoped log entries (newest first). */
    @GetMapping("/{id}/logs")
    public ResponseEntity<NgApiResponse<List<PhysicalObjectAggregate.ObjectLog>>> logs(@PathVariable Long id) {
        List<PhysicalObjectAggregate.ObjectLog> logs = aggregateService.listLogs(id);
        return ResponseEntity.ok(new NgApiResponse<>(logs, logs.size() + " logs"));
    }

    /** Add a log entry from the field (author = JWT principal via Spring Data auditing). */
    @PostMapping("/{id}/logs")
    public ResponseEntity<NgApiResponse<PhysicalObjectAggregate.ObjectLog>> addLog(@PathVariable Long id, @RequestBody AddLogRequest req) {
        if (req == null || req.content() == null || req.content().isBlank())
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "content required"));
        return ResponseEntity.ok(new NgApiResponse<>(
                aggregateService.addLog(id, req.content().trim(), req.needsAttention() != null && req.needsAttention()), "added"));
    }

    public record AddLogRequest(String content, Boolean needsAttention) {}
}
