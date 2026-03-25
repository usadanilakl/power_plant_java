package com.dk_power.power_plant_java.controller.angular.sim_equipment;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.sim_equipment.SimEquipmentDto;
import com.dk_power.power_plant_java.entities.sim_equipment.SourceEntityType;
import com.dk_power.power_plant_java.sevice.angular.sim_equipment.NgSimEquipmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/ng/sim-equipment")
@RequiredArgsConstructor
public class NgSimEquipmentController {

    private final NgSimEquipmentService service;

    @GetMapping("/get-all")
    public ResponseEntity<NgApiResponse<List<SimEquipmentDto>>> getAll() {
        try {
            List<SimEquipmentDto> items = service.getAllDtos();
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(items, "SimEquipment list retrieved", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @GetMapping("/get-by-id/{id}")
    public ResponseEntity<NgApiResponse<SimEquipmentDto>> getById(@PathVariable String id) {
        try {
            SimEquipmentDto dto = service.getSimEquipmentById(id);
            if (dto == null) {
                return ResponseEntity.status(404).contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(null, "SimEquipment not found", LocalDateTime.now()));
            }
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(dto, "SimEquipment retrieved", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @GetMapping("/search")
    public ResponseEntity<NgApiResponse<List<SimEquipmentDto>>> search(@RequestParam String q) {
        try {
            List<SimEquipmentDto> results = service.searchByName(q);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(results, "Search results", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @GetMapping("/by-source")
    public ResponseEntity<NgApiResponse<SimEquipmentDto>> bySource(
        @RequestParam String type, @RequestParam Long id
    ) {
        try {
            SourceEntityType entityType = parseSourceEntityType(type);
            Optional<SimEquipmentDto> dto = service.findBySource(entityType, id);
            return dto.map(d -> ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(d, "Found", LocalDateTime.now())))
                .orElseGet(() -> ResponseEntity.status(404).contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(null, "Not found", LocalDateTime.now())));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<NgApiResponse<SimEquipmentDto>> create(@RequestBody SimEquipmentDto dto) {
        try {
            SimEquipmentDto created = service.createSimEquipment(dto);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(created, "SimEquipment created", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PostMapping("/from-loto-point/{id}")
    public ResponseEntity<NgApiResponse<SimEquipmentDto>> fromLotoPoint(@PathVariable Long id) {
        try {
            SimEquipmentDto dto = service.fromLotoPoint(id);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(dto, "SimEquipment from LotoPoint", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PostMapping("/from-equipment/{id}")
    public ResponseEntity<NgApiResponse<SimEquipmentDto>> fromEquipment(@PathVariable Long id) {
        try {
            SimEquipmentDto dto = service.fromEquipment(id);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(dto, "SimEquipment from Equipment", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<NgApiResponse<SimEquipmentDto>> update(@PathVariable String id, @RequestBody SimEquipmentDto dto) {
        try {
            SimEquipmentDto updated = service.updateSimEquipment(id, dto);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(updated, "SimEquipment updated", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<NgApiResponse<Void>> delete(@PathVariable String id) {
        try {
            service.softDelete(id);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(null, "SimEquipment deleted", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    private SourceEntityType parseSourceEntityType(String type) {
        String normalized = type.trim().toUpperCase().replace('-', '_');
        if ("LOTOPOINT".equals(normalized)) {
            normalized = "LOTO_POINT";
        }
        return SourceEntityType.valueOf(normalized);
    }
}
