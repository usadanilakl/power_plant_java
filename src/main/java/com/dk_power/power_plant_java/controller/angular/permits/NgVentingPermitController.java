package com.dk_power.power_plant_java.controller.angular.permits;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.permits.VentingPermitDto;
import com.dk_power.power_plant_java.sevice.angular.permits.NgVentingPermitService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/ng/venting-permits")
@RequiredArgsConstructor
public class NgVentingPermitController {

    private final NgVentingPermitService service;

    @GetMapping("/get-all")
    public ResponseEntity<NgApiResponse<List<VentingPermitDto>>> getAll() {
        try {
            List<VentingPermitDto> items = service.getAllDtos();
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(items, "Venting permits retrieved successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @GetMapping("/get-by-id/{id}")
    public ResponseEntity<NgApiResponse<VentingPermitDto>> getById(@PathVariable String id) {
        try {
            VentingPermitDto dto = service.getDtoById(id);
            if (dto == null) return ResponseEntity.notFound().build();
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(dto, "Venting permit retrieved successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<NgApiResponse<VentingPermitDto>> create(@RequestBody VentingPermitDto dto) {
        try {
            VentingPermitDto created = service.createPermit(dto);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(created, "Venting permit created successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<NgApiResponse<VentingPermitDto>> update(@PathVariable String id, @RequestBody VentingPermitDto dto) {
        try {
            VentingPermitDto updated = service.updatePermit(id, dto);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(updated, "Venting permit updated successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<NgApiResponse<Void>> delete(@PathVariable String id) {
        try {
            service.hardDelete(id);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(null, "Venting permit deleted successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PostMapping("/save-all")
    public ResponseEntity<NgApiResponse<List<VentingPermitDto>>> saveAll(@RequestBody List<VentingPermitDto> permits) {
        try {
            List<VentingPermitDto> saved = service.saveAll(permits);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(saved, "Venting permits saved successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }
}
