package com.dk_power.power_plant_java.controller.angular.loto;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.permits.WalkdownSessionDto;
import com.dk_power.power_plant_java.mappers.permits.WalkdownSessionMapper;
import com.dk_power.power_plant_java.sevice.angular.loto.NgWalkdownSessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/ng/loto/walkdown-sessions")
@RequiredArgsConstructor
public class NgWalkdownSessionController {
    private final NgWalkdownSessionService service;
    private final WalkdownSessionMapper mapper;

    @GetMapping("/by-loto/{lotoId}")
    public ResponseEntity<NgApiResponse<List<WalkdownSessionDto>>> listForLoto(@PathVariable Long lotoId) {
        try {
            List<WalkdownSessionDto> dtos = service.listForLoto(lotoId).stream().map(mapper::toDto).toList();
            return ResponseEntity.ok(new NgApiResponse<>(dtos, "Walkdown sessions retrieved"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping("/{sessionId}")
    public ResponseEntity<NgApiResponse<WalkdownSessionDto>> getOne(@PathVariable Long sessionId) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(mapper.toDto(service.getById(sessionId)), "Walkdown session retrieved"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping("/by-loto/{lotoId}")
    public ResponseEntity<NgApiResponse<WalkdownSessionDto>> request(@PathVariable Long lotoId,
                                                                     @RequestBody(required = false) Map<String, Object> body) {
        try {
            String crewName = body != null && body.get("crewName") != null ? body.get("crewName").toString() : null;
            String notes    = body != null && body.get("notes") != null    ? body.get("notes").toString()    : null;
            return ResponseEntity.ok(new NgApiResponse<>(
                    mapper.toDto(service.requestWalkdown(lotoId, crewName, notes)),
                    "Walkdown session started"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PutMapping("/{sessionId}/point/{pointId}/check")
    public ResponseEntity<NgApiResponse<WalkdownSessionDto>> checkPoint(@PathVariable Long sessionId,
                                                                       @PathVariable Long pointId,
                                                                       @RequestBody Map<String, Object> body) {
        try {
            boolean checked = Boolean.TRUE.equals(body.get("checked"));
            String notes = body.get("notes") != null ? body.get("notes").toString() : null;
            return ResponseEntity.ok(new NgApiResponse<>(
                    mapper.toDto(service.checkPoint(sessionId, pointId, checked, notes)),
                    "Point check toggled"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping("/{sessionId}/complete")
    public ResponseEntity<NgApiResponse<WalkdownSessionDto>> complete(@PathVariable Long sessionId,
                                                                     @RequestBody(required = false) Map<String, Object> body) {
        try {
            String notes = body != null && body.get("notes") != null ? body.get("notes").toString() : null;
            return ResponseEntity.ok(new NgApiResponse<>(
                    mapper.toDto(service.completeWalkdown(sessionId, notes)),
                    "Walkdown completed"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }
}
