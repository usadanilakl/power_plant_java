package com.dk_power.power_plant_java.controller.angular.permits;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.permits.NgJhaDto;
import com.dk_power.power_plant_java.entities.permits.Jha;
import com.dk_power.power_plant_java.mappers.permits.JhaMapper;
import com.dk_power.power_plant_java.sevice.angular.permits.NgJhaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/ng/jhas")
public class JhaController {

    private final NgJhaService jhaService;
    private final JhaMapper jhaMapper;

    @GetMapping("/get-all")
    public ResponseEntity<NgApiResponse<List<NgJhaDto>>> getAll() {
        try {
            List<Jha> allJhas = jhaService.getAll();
            List<NgJhaDto> allDtos = allJhas.stream().map(jhaMapper::convertToNgDto).toList();
            return ResponseEntity.ok(
                    new NgApiResponse<>(allDtos, "Successfully got all JHAs from local DB")
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new NgApiResponse<>(null, "Failed to get all JHAs: " + e.getMessage())
            );
        }
    }

    @GetMapping("/get-all-by-status/{status}")
    public ResponseEntity<NgApiResponse<List<NgJhaDto>>> getAllByStatus(@PathVariable String status) {
        try {
            List<NgJhaDto> allDtos = jhaService.getAllNgDtosByStatus(status);
            return ResponseEntity.ok(
                    new NgApiResponse<>(allDtos, "Successfully got all JHAs with status '" + status + "'")
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new NgApiResponse<>(null, "Failed to get JHAs with status " + status + ": " + e.getMessage())
            );
        }
    }

    @GetMapping("/get-by-id/{id}")
    public ResponseEntity<NgApiResponse<NgJhaDto>> getById(@PathVariable Long id) {
        try {
            Jha entity = jhaService.getEntityById(id);
            NgJhaDto dto = jhaMapper.convertToNgDto(entity);
            return ResponseEntity.ok(
                    new NgApiResponse<>(dto, "Successfully got JHA by id")
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new NgApiResponse<>(null, "Failed to get JHA by id: " + e.getMessage())
            );
        }
    }

    @GetMapping("/by-work-request/{workRequestId}")
    public ResponseEntity<NgApiResponse<List<NgJhaDto>>> getByWorkRequest(@PathVariable Long workRequestId) {
        try {
            List<NgJhaDto> dtos = jhaService.getByWorkRequestId(workRequestId);
            return ResponseEntity.ok(
                    new NgApiResponse<>(dtos, "Successfully got JHAs for work request")
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new NgApiResponse<>(null, "Failed to get JHAs for work request: " + e.getMessage())
            );
        }
    }

    @PostMapping
    public ResponseEntity<NgApiResponse<NgJhaDto>> save(@RequestBody NgJhaDto jha) {
        try {
            NgJhaDto saved = jhaService.saveFromDto(jha);
            return ResponseEntity.ok(
                    new NgApiResponse<>(saved, "Successfully saved JHA")
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new NgApiResponse<>(null, "Failed to save JHA: " + e.getMessage())
            );
        }
    }
}
