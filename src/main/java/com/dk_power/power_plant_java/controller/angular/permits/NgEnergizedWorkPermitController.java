package com.dk_power.power_plant_java.controller.angular.permits;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.permits.EnergizedWorkPermitDto;
import com.dk_power.power_plant_java.sevice.angular.permits.NgEnergizedWorkPermitService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/ng/energized-work-permits")
@RequiredArgsConstructor
public class NgEnergizedWorkPermitController {

    private final NgEnergizedWorkPermitService service;

    @GetMapping("/get-all")
    public ResponseEntity<NgApiResponse<List<EnergizedWorkPermitDto>>> getAll() {
        try {
            List<EnergizedWorkPermitDto> items = service.getAllDtos();
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(items, "Energized work permits retrieved successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<NgApiResponse<List<EnergizedWorkPermitDto>>> getAllRest() {
        return getAll();
    }

    @GetMapping("/get-by-id/{id}")
    public ResponseEntity<NgApiResponse<EnergizedWorkPermitDto>> getById(@PathVariable String id) {
        try {
            EnergizedWorkPermitDto dto = service.getDtoById(id);
            if (dto == null) return ResponseEntity.notFound().build();
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(dto, "Energized work permit retrieved successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<NgApiResponse<EnergizedWorkPermitDto>> getByIdRest(@PathVariable String id) {
        return getById(id);
    }

    @PostMapping
    public ResponseEntity<NgApiResponse<EnergizedWorkPermitDto>> create(@RequestBody EnergizedWorkPermitDto dto) {
        try {
            EnergizedWorkPermitDto created = service.createPermit(dto);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(created, "Energized work permit created successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<NgApiResponse<EnergizedWorkPermitDto>> update(@PathVariable String id, @RequestBody EnergizedWorkPermitDto dto) {
        try {
            EnergizedWorkPermitDto updated = service.updatePermit(id, dto);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(updated, "Energized work permit updated successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<NgApiResponse<String>> delete(@PathVariable String id) {
        try {
            service.softDelete(id);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>("Deleted", "Energized work permit deleted successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PostMapping("/save-all")
    public ResponseEntity<NgApiResponse<List<EnergizedWorkPermitDto>>> saveAll(@RequestBody List<EnergizedWorkPermitDto> permits) {
        try {
            List<EnergizedWorkPermitDto> saved = service.saveAll(permits);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(saved, "Energized work permits saved successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }
}
