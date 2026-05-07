package com.dk_power.power_plant_java.controller.angular.loto;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.permits.WalkdownChecklistDto;
import com.dk_power.power_plant_java.mappers.permits.WalkdownChecklistMapper;
import com.dk_power.power_plant_java.sevice.angular.loto.NgWalkdownService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/ng")
@RequiredArgsConstructor
public class NgWalkdownController {
    private final NgWalkdownService walkdownService;
    private final WalkdownChecklistMapper walkdownMapper;

    @PostMapping("/lotos/{lotoId}/walkdowns")
    public ResponseEntity<NgApiResponse<WalkdownChecklistDto>> requestWalkdown(
            @PathVariable Long lotoId,
            @RequestBody(required = false) Map<String, String> body) {
        try {
            String notes = body != null ? body.get("notes") : null;
            return ResponseEntity.ok(new NgApiResponse<>(
                    walkdownMapper.convertToDto(walkdownService.requestWalkdown(lotoId, notes)),
                    "Walkdown started"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping("/lotos/{lotoId}/walkdowns")
    public ResponseEntity<NgApiResponse<List<WalkdownChecklistDto>>> listForLoto(@PathVariable Long lotoId) {
        try {
            List<WalkdownChecklistDto> list = walkdownService.listForLoto(lotoId).stream()
                    .map(walkdownMapper::convertToDto).toList();
            return ResponseEntity.ok(new NgApiResponse<>(list, "Walkdowns retrieved"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PutMapping("/walkdowns/{walkdownId}/check-point/{pointId}")
    public ResponseEntity<NgApiResponse<WalkdownChecklistDto>> checkPoint(
            @PathVariable Long walkdownId,
            @PathVariable Long pointId,
            @RequestBody Map<String, Object> body) {
        try {
            boolean checked = body.get("checked") instanceof Boolean ? (Boolean) body.get("checked") : false;
            String notes = body.get("notes") instanceof String ? (String) body.get("notes") : null;
            return ResponseEntity.ok(new NgApiResponse<>(
                    walkdownMapper.convertToDto(walkdownService.checkPoint(walkdownId, pointId, checked, notes)),
                    "Point updated"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PutMapping("/walkdowns/{walkdownId}/complete")
    public ResponseEntity<NgApiResponse<WalkdownChecklistDto>> complete(
            @PathVariable Long walkdownId,
            @RequestBody(required = false) Map<String, String> body) {
        try {
            String notes = body != null ? body.get("notes") : null;
            return ResponseEntity.ok(new NgApiResponse<>(
                    walkdownMapper.convertToDto(walkdownService.completeWalkdown(walkdownId, notes)),
                    "Walkdown completed"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }
}
